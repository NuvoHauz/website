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
    const airbnb = parsed.transactions.find((txn) =>
      txn.description.toLowerCase().includes("airbnb payments"),
    );
    assert.ok(airbnb);
    assert.equal(airbnb?.amountCents, 245000);
    assert.equal(airbnb?.direction, "inflow");
  });

  it("parses debit/credit column exports", () => {
    const parsed = parseQuickBooksCsv(
      creditCsv,
      { accountId: "visa", accountName: "Visa" },
      "batch_2",
    );
    assert.ok(parsed.transactions.length >= 5);
    const plumber = parsed.transactions.find((txn) =>
      txn.description.toLowerCase().includes("plumber"),
    );
    assert.equal(plumber?.amountCents, -21000);
  });
});

describe("runBookkeeper", () => {
  it("consolidates multi-account imports and builds CPA + P&L handoffs", () => {
    const result = runBookkeeper({
      period: { start: "2026-08-01", end: "2026-08-31" },
      imports: [
        {
          source: {
            accountId: "checking",
            accountName: "Operating Checking",
            entity: "Riu House",
          },
          csvText: checkingCsv,
        },
        {
          source: {
            accountId: "visa",
            accountName: "Business Visa",
            entity: "Riu House",
          },
          csvText: creditCsv,
        },
      ],
    });

    assert.ok(result.log.transactions.length > 10);
    assert.equal(result.log.accounts.length, 2);
    assert.ok(result.profitAndLoss.incomeCents > 0);
    assert.ok(result.profitAndLoss.expenseCents > 0);
    assert.ok(result.cpaPack.consolidatedCsv.includes("Operating Checking"));
    assert.ok(result.cpaPack.summaryMarkdown.includes("CPA monthly package"));
    assert.ok(
      result.handoffs.some(
        (handoff) =>
          handoff.from === "bookkeeper" && handoff.to === "profit_and_loss",
      ),
    );
    assert.ok(result.questions.length > 0);
  });

  it("learns patterns from answers and clears questions", () => {
    const first = runBookkeeper({
      period: { start: "2026-08-01", end: "2026-08-31" },
      imports: [
        {
          source: { accountId: "checking", accountName: "Checking" },
          csvText: checkingCsv,
        },
      ],
    });

    const amazonQuestion = first.questions.find((question) =>
      question.prompt.toLowerCase().includes("retail"),
    );
    assert.ok(amazonQuestion);

    const continued = continueBookkeeperWithAnswers({
      categorized: first.categorized,
      questions: first.questions,
      period: { start: "2026-08-01", end: "2026-08-31" },
      learnedPatterns: first.learnedPatterns,
      answers: [
        {
          questionId: amazonQuestion!.id,
          transactionId: amazonQuestion!.transactionId,
          categoryId: "supplies",
          learnPattern: true,
        },
      ],
    });

    assert.ok(
      continued.learnedPatterns.some((pattern) =>
        pattern.normalizedMerchant.includes("amzn"),
      ),
    );
    assert.ok(
      !continued.questions.some(
        (question) => question.transactionId === amazonQuestion!.transactionId,
      ),
    );

    const recurring = identifyRecurringPatterns(continued.log.transactions);
    assert.ok(Array.isArray(recurring));
  });
});
