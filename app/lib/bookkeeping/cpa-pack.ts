import { CATEGORY_LABELS, getCompanyProfile } from "./default-rules";
import {
  consolidatedLogToCsv,
  qboCoaApplyCsv,
  qboCoaApplyMarkdown,
} from "./consolidate";
import { profitAndLossToCsv } from "./profit-and-loss";
import {
  buildQboBankRuleSuggestions,
  qboBankRulesSetupMarkdown,
  qboBankRulesToCsv,
} from "./qbo-bank-rules";
import type {
  CategorizationQuestion,
  CategorizedTransaction,
  ConsolidatedTransactionLog,
  CpaDocumentationPack,
  LearnedPattern,
  ProfitAndLossReport,
  QboBankRuleSuggestion,
} from "./types";

function money(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

export function buildCpaDocumentationPack(
  log: ConsolidatedTransactionLog,
  profitAndLoss: ProfitAndLossReport,
  questions: CategorizationQuestion[],
  options?: {
    categorized?: CategorizedTransaction[];
    learnedPatterns?: LearnedPattern[];
    bankRules?: QboBankRuleSuggestion[];
  },
): CpaDocumentationPack {
  const profile = getCompanyProfile(log.companyId);
  const bankRules =
    options?.bankRules ??
    buildQboBankRuleSuggestions({
      companyId: log.companyId,
      categorized: options?.categorized ?? log.transactions,
      learnedPatterns: options?.learnedPatterns,
      defaultRules: profile.rules,
    });

  const accountList = log.accounts
    .map((account) => `- ${account.accountName}${account.entity ? ` (${account.entity})` : ""}`)
    .join("\n");

  const rulePreview = bankRules
    .slice(0, 12)
    .map(
      (rule) =>
        `- \`${rule.contains}\` → **${rule.qboAccountName}** (${rule.source}, support ${rule.supportCount})`,
    )
    .join("\n");

  const summaryMarkdown = `# CPA monthly package — ${log.companyName}

Period: ${log.period.start} to ${log.period.end}  
Generated: ${log.generatedAt}  
Automation: QuickBooks Online **Bank Rules** (pending/future bank feed)

## Goal
Automate classification of bank-feed pending transactions. Intuit does not allow apps to post into Banking → For review via API; Bank Rules inside QBO are the supported automation.

## Bank / credit accounts included
${accountList || "- (none)"}

## Operating P&L snapshot
- Income: ${money(profitAndLoss.incomeCents)}
- COGS: ${money(profitAndLoss.cogsCents)}
- Expenses: ${money(profitAndLoss.expenseCents)}
- Net operating: ${money(profitAndLoss.netCents)}

## Bank Rules to install in QBO (${bankRules.length} suggested)
${rulePreview || "- (none yet)"}

See attached bank-rules setup guide. Enable **Also apply to transactions waiting for review**.

## Reconciliation readiness
- Transactions in period: ${log.transactions.length}
- Uncategorized: ${log.unmatchedCount}
- Open questions (edge cases only): ${log.openQuestionCount}
`;

  const openItemsMarkdown =
    questions.length === 0
      ? `# Open items\n\nNo open edge-case questions for this period.\n`
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
    qboBankRulesCsv: qboBankRulesToCsv(bankRules),
    qboBankRulesMarkdown: qboBankRulesSetupMarkdown(profile, bankRules),
    profitAndLossCsv: profitAndLossToCsv(profitAndLoss),
    openItemsMarkdown,
    categoryTotals: log.totalsByCategory,
  };
}
