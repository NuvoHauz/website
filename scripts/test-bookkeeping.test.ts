import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  continueBookkeeperWithAnswers,
  identifyRecurringPatterns,
  parseQuickBooksCsv,
  runBookkeeper,
} from "../app/lib/bookkeeping";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../app/lib/bookkeeping/fixtures",
);

const checkingCsv = readFileSync(
  join(fixturesDir, "sample-qb-checking.csv"),
  "utf8",
);
const creditCsv = readFileSync(join(fixturesDir, "sample-qb-credit.csv"), "utf8");

describe("parseQuickBooksCsv", () => {
  it("parses amount-column QuickBooks exports", () => {
    const parsed = parseQuickBooksCsv(
      checkingCsv,
      { accountId: "checking", accountName: "Checking" },
      "batch_1",
    );
    assert.ok(parsed.transactions.length >= 10);
    const income = parsed.transactions.find((txn) =>
      txn.description.toLowerCase().includes("customer payment"),
    );
    assert.ok(income);
    assert.equal(income?.amountCents, 480000);
    assert.equal(income?.direction, "inflow");
  });

  it("parses debit/credit column exports", () => {
    const parsed = parseQuickBooksCsv(
      creditCsv,
      { accountId: "visa", accountName: "Visa" },
      "batch_2",
    );
    assert.ok(parsed.transactions.length >= 5);
    const harbor = parsed.transactions.find((txn) =>
      txn.description.toLowerCase().includes("harbor freight"),
    );
    assert.equal(harbor?.amountCents, -8950);
  });
});

describe("runBookkeeper Alfa Renovations COA", () => {
  it("maps multi-account imports into QBO Chart of Accounts batches", () => {
    const result = runBookkeeper({
      companyId: "alfa-renovations",
      period: { start: "2026-08-01", end: "2026-08-31" },
      imports: [
        {
          source: {
            accountId: "checking",
            accountName: "Operating Checking",
            entity: "Alfa Renovations",
          },
          csvText: checkingCsv,
        },
        {
          source: {
            accountId: "visa",
            accountName: "Business Visa",
            entity: "Alfa Renovations",
          },
          csvText: creditCsv,
        },
      ],
    });

    assert.equal(result.companyName, "Alfa Renovations");
    assert.ok(result.log.transactions.length > 10);
    assert.equal(result.log.accounts.length, 2);
    assert.ok(result.log.qboBatches.length >= 3);
    assert.ok(result.bankRules.length > 0);
    assert.ok(result.cpaPack.qboBankRulesCsv.includes("Assign QBO account"));
    assert.ok(result.cpaPack.qboBankRulesMarkdown.includes("Bank Rules"));
    assert.ok(
      result.log.qboBatches.some((batch) => batch.qboAccountName === "Job Materials"),
    );
    assert.ok(
      result.log.transactions.some((txn) => txn.qboAccountName === "Job Income"),
    );
    assert.ok(result.profitAndLoss.incomeCents > 0);
    assert.ok(result.cpaPack.qboCoaApplyCsv.includes("QBO Chart of Accounts"));
    assert.ok(result.cpaPack.qboCoaApplyMarkdown.includes("batch apply"));
    assert.ok(
      result.handoffs.some(
        (handoff) =>
          handoff.from === "bookkeeper" && handoff.to === "profit_and_loss",
      ),
    );
  });

  it("learns merchant → COA patterns from answers", () => {
    const first = runBookkeeper({
      companyId: "alfa-renovations",
      period: { start: "2026-08-01", end: "2026-08-31" },
      imports: [
        {
          source: { accountId: "checking", accountName: "Checking" },
          csvText: checkingCsv,
        },
      ],
    });

    const amazonQuestion = first.questions.find((question) =>
      question.prompt.toLowerCase().includes("amazon"),
    );
    assert.ok(amazonQuestion);

    const continued = continueBookkeeperWithAnswers({
      companyId: "alfa-renovations",
      categorized: first.categorized,
      questions: first.questions,
      period: { start: "2026-08-01", end: "2026-08-31" },
      learnedPatterns: first.learnedPatterns,
      answers: [
        {
          questionId: amazonQuestion!.id,
          transactionId: amazonQuestion!.transactionId,
          categoryId: "materials",
          learnPattern: true,
        },
      ],
    });

    assert.ok(
      continued.learnedPatterns.some(
        (pattern) =>
          pattern.normalizedMerchant.includes("amzn") &&
          pattern.categoryId === "materials" &&
          pattern.companyId === "alfa-renovations",
      ),
    );
    assert.ok(
      continued.categorized.some(
        (txn) =>
          txn.id === amazonQuestion!.transactionId &&
          txn.qboAccountName === "Job Materials",
      ),
    );

    const recurring = identifyRecurringPatterns(continued.log.transactions);
    assert.ok(Array.isArray(recurring));
  });
});
