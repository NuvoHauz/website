import { CATEGORY_LABELS } from "./default-rules";
import {
  consolidatedLogToCsv,
  qboCoaApplyCsv,
  qboCoaApplyMarkdown,
} from "./consolidate";
import { profitAndLossToCsv } from "./profit-and-loss";
import type {
  CategorizationQuestion,
  ConsolidatedTransactionLog,
  CpaDocumentationPack,
  ProfitAndLossReport,
} from "./types";

function money(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

export function buildCpaDocumentationPack(
  log: ConsolidatedTransactionLog,
  profitAndLoss: ProfitAndLossReport,
  questions: CategorizationQuestion[],
): CpaDocumentationPack {
  const accountList = log.accounts
    .map((account) => `- ${account.accountName}${account.entity ? ` (${account.entity})` : ""}`)
    .join("\n");

  const batchSummary = log.qboBatches
    .map(
      (batch) =>
        `- **${batch.qboAccountName}** (${batch.accountType}): ${batch.transactionCount} txns · ${money(batch.totalCents)}`,
    )
    .join("\n");

  const categoryLines = Object.entries(log.totalsByCategory)
    .filter(([, amount]) => amount !== 0)
    .map(
      ([categoryId, amount]) =>
        `- ${CATEGORY_LABELS[categoryId as keyof typeof CATEGORY_LABELS]}: ${money(amount)}`,
    )
    .join("\n");

  const summaryMarkdown = `# CPA monthly package — ${log.companyName}

Period: ${log.period.start} to ${log.period.end}  
Generated: ${log.generatedAt}  
Accounting system: QuickBooks Online (Chart of Accounts batch apply)

## Bank / credit accounts included
${accountList || "- (none)"}

## Operating P&L snapshot
- Income: ${money(profitAndLoss.incomeCents)}
- COGS: ${money(profitAndLoss.cogsCents)}
- Expenses: ${money(profitAndLoss.expenseCents)}
- Net operating: ${money(profitAndLoss.netCents)}

## QBO Chart of Accounts batches (apply these instead of one-by-one)
${batchSummary || "- (none)"}

## Category totals (signed bank amounts)
${categoryLines || "- (none)"}

## Reconciliation readiness
- Transactions in period: ${log.transactions.length}
- Uncategorized: ${log.unmatchedCount}
- Open categorization questions: ${log.openQuestionCount}

## Notes for CPA
- Work the attached **QBO COA apply** file by Chart of Accounts bucket (e.g. finish all Job Materials, then Subcontractors).
- Transfers, owner draws, personal, and loan principal are under “other” and need review.
- Attach receipts for materials, subcontractors, and large tool purchases.
`;

  const openItemsMarkdown =
    questions.length === 0
      ? `# Open items\n\nNo open categorization questions for this period.\n`
      : `# Open items\n\n${questions
          .map(
            (question, index) =>
              `${index + 1}. ${question.prompt}${
                question.suggestedCategoryId
                  ? ` (suggested: ${CATEGORY_LABELS[question.suggestedCategoryId]})`
                  : ""
              }`,
          )
          .join("\n")}\n`;

  return {
    period: log.period,
    generatedAt: log.generatedAt,
    companyId: log.companyId,
    companyName: log.companyName,
    summaryMarkdown,
    consolidatedCsv: consolidatedLogToCsv(log),
    qboCoaApplyCsv: qboCoaApplyCsv(log),
    qboCoaApplyMarkdown: qboCoaApplyMarkdown(log),
    profitAndLossCsv: profitAndLossToCsv(profitAndLoss),
    openItemsMarkdown,
    categoryTotals: log.totalsByCategory,
  };
}
