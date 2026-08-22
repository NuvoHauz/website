import { CATEGORY_LABELS } from "./default-rules";
import { consolidatedLogToCsv } from "./consolidate";
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

  const categoryLines = Object.entries(log.totalsByCategory)
    .filter(([, amount]) => amount !== 0)
    .map(
      ([categoryId, amount]) =>
        `- ${CATEGORY_LABELS[categoryId as keyof typeof CATEGORY_LABELS]}: ${money(amount)}`,
    )
    .join("\n");

  const summaryMarkdown = `# CPA monthly package — ${log.period.start} to ${log.period.end}

Generated: ${log.generatedAt}

## Accounts included
${accountList || "- (none)"}

## Operating P&L snapshot
- Income: ${money(profitAndLoss.incomeCents)}
- Expenses: ${money(profitAndLoss.expenseCents)}
- Net operating: ${money(profitAndLoss.netCents)}

## Category totals (signed bank amounts)
${categoryLines || "- (none)"}

## Reconciliation readiness
- Transactions in period: ${log.transactions.length}
- Uncategorized: ${log.unmatchedCount}
- Open categorization questions: ${log.openQuestionCount}

## Notes for CPA
- Transfers, owner draws, personal, and mortgage principal are listed under “other” and should not be treated as operating expenses without review.
- Attach supporting receipts for repairs, professional fees, and large supply purchases.
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
    summaryMarkdown,
    consolidatedCsv: consolidatedLogToCsv(log),
    profitAndLossCsv: profitAndLossToCsv(profitAndLoss),
    openItemsMarkdown,
    categoryTotals: log.totalsByCategory,
  };
}
