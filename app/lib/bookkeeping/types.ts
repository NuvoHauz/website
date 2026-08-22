/** Shared bookkeeping types for QuickBooks imports, categorization, and CPA packs. */

export type MoneyCents = number;

export type TransactionDirection = "inflow" | "outflow" | "transfer";

export type BookkeepingCategoryId =
  | "rental_income"
  | "platform_fees"
  | "cleaning"
  | "supplies"
  | "repairs_maintenance"
  | "utilities"
  | "insurance"
  | "property_management"
  | "mortgage_loan"
  | "hoa_fees"
  | "professional_fees"
  | "advertising"
  | "owner_travel"
  | "taxes_licenses"
  | "bank_fees"
  | "transfer"
  | "owner_draw"
  | "personal"
  | "uncategorized";

export type CategoryConfidence = "high" | "medium" | "low" | "needs_input";

export type SpecialistAgentKind = "bookkeeper" | "profit_and_loss" | "tax_prep" | "reconciliation";

export interface AccountSource {
  /** Stable id for the bank/credit/cash account in QuickBooks. */
  accountId: string;
  /** Human label, e.g. "Operating Checking — BAC". */
  accountName: string;
  /** Optional entity / property this account belongs to. */
  entity?: string;
  /** Optional currency ISO code; defaults to USD. */
  currency?: string;
}

export interface ImportedTransaction {
  id: string;
  source: AccountSource;
  date: string;
  description: string;
  memo?: string;
  payee?: string;
  amountCents: MoneyCents;
  direction: TransactionDirection;
  raw: Record<string, string>;
  importBatchId: string;
}

export interface CategoryRule {
  id: string;
  categoryId: BookkeepingCategoryId;
  /** Case-insensitive substrings matched against description/memo/payee. */
  patterns: string[];
  /** Optional amount sign hint: positive = inflow, negative = outflow. */
  amountSign?: "positive" | "negative" | "any";
  priority: number;
  questionPrompt?: string;
  notes?: string;
}

export interface LearnedPattern {
  id: string;
  normalizedMerchant: string;
  categoryId: BookkeepingCategoryId;
  createdFromTransactionId: string;
  answeredAt: string;
}

export interface CategorizationQuestion {
  id: string;
  transactionId: string;
  prompt: string;
  options: Array<{
    value: BookkeepingCategoryId;
    label: string;
  }>;
  suggestedCategoryId?: BookkeepingCategoryId;
  evidence: string[];
}

export interface CategorizedTransaction extends ImportedTransaction {
  categoryId: BookkeepingCategoryId;
  confidence: CategoryConfidence;
  matchedRuleId?: string;
  matchedPattern?: string;
  questionId?: string;
  notes?: string;
}

export interface CategoryAnswer {
  questionId: string;
  transactionId: string;
  categoryId: BookkeepingCategoryId;
  /** When true, learn a reusable merchant pattern from this answer. */
  learnPattern?: boolean;
  note?: string;
}

export interface ConsolidatedTransactionLog {
  period: { start: string; end: string };
  generatedAt: string;
  accounts: AccountSource[];
  transactions: CategorizedTransaction[];
  totalsByCategory: Record<BookkeepingCategoryId, MoneyCents>;
  unmatchedCount: number;
  openQuestionCount: number;
}

export interface ProfitAndLossLine {
  categoryId: BookkeepingCategoryId;
  label: string;
  amountCents: MoneyCents;
  kind: "income" | "expense" | "other";
}

export interface ProfitAndLossReport {
  period: { start: string; end: string };
  currency: string;
  incomeCents: MoneyCents;
  expenseCents: MoneyCents;
  netCents: MoneyCents;
  lines: ProfitAndLossLine[];
  sourceLogId?: string;
  producedBy: SpecialistAgentKind;
}

export interface AgentHandoffEnvelope<TPayload> {
  from: SpecialistAgentKind;
  to: SpecialistAgentKind;
  purpose: string;
  createdAt: string;
  payload: TPayload;
}

export interface CpaDocumentationPack {
  period: { start: string; end: string };
  generatedAt: string;
  summaryMarkdown: string;
  consolidatedCsv: string;
  profitAndLossCsv: string;
  openItemsMarkdown: string;
  categoryTotals: Record<BookkeepingCategoryId, MoneyCents>;
}

export interface BookkeeperRunInput {
  period: { start: string; end: string };
  imports: Array<{
    source: AccountSource;
    csvText: string;
    importBatchId?: string;
  }>;
  learnedPatterns?: LearnedPattern[];
  extraRules?: CategoryRule[];
}

export interface BookkeeperRunResult {
  log: ConsolidatedTransactionLog;
  categorized: CategorizedTransaction[];
  questions: CategorizationQuestion[];
  profitAndLoss: ProfitAndLossReport;
  cpaPack: CpaDocumentationPack;
  handoffs: Array<AgentHandoffEnvelope<unknown>>;
  learnedPatterns: LearnedPattern[];
}
