/** Shared bookkeeping types for QuickBooks imports, categorization, and CPA packs. */

export type MoneyCents = number;

export type TransactionDirection = "inflow" | "outflow" | "transfer";

/** Internal category ids mapped to each company file's Chart of Accounts. */
export type BookkeepingCategoryId =
  | "job_income"
  | "rental_income"
  | "materials"
  | "subcontractors"
  | "equipment_rental"
  | "tools"
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
  | "vehicle"
  | "office_expenses"
  | "meals"
  | "owner_travel"
  | "taxes_licenses"
  | "bank_fees"
  | "transfer"
  | "owner_draw"
  | "owner_investment"
  | "personal"
  | "uncategorized";

export type CategoryConfidence = "high" | "medium" | "low" | "needs_input";

export type SpecialistAgentKind =
  | "bookkeeper"
  | "profit_and_loss"
  | "tax_prep"
  | "reconciliation";

export type AccountingSystemId = "quickbooks_online" | "generic";

export type CoaAccountType =
  | "Income"
  | "Cost of Goods Sold"
  | "Expense"
  | "Other Expense"
  | "Other Income"
  | "Bank"
  | "Credit Card"
  | "Other Current Liability"
  | "Equity"
  | "Other";

export interface ChartOfAccountEntry {
  categoryId: BookkeepingCategoryId;
  /** Exact (or preferred) name as it appears in the QBO Chart of Accounts. */
  qboAccountName: string;
  accountType: CoaAccountType;
  accountNumber?: string;
  plSection: "income" | "cogs" | "expense" | "other";
}

export interface CompanyProfile {
  id: string;
  name: string;
  accountingSystem: AccountingSystemId;
  chartOfAccounts: ChartOfAccountEntry[];
  /** Extra / overriding merchant rules for this company file. */
  rules?: CategoryRule[];
}

export interface AccountSource {
  /** Stable id for the bank/credit/cash account in QuickBooks. */
  accountId: string;
  /** Human label, e.g. "Operating Checking — Chase". */
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
  companyId?: string;
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
  /** Resolved QBO Chart of Accounts name for the active company file. */
  qboAccountName: string;
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

export interface QboCoaBatch {
  qboAccountName: string;
  categoryId: BookkeepingCategoryId;
  accountType: CoaAccountType;
  transactionCount: number;
  totalCents: MoneyCents;
  transactions: CategorizedTransaction[];
}

export type QboBankRuleConditionField = "Description" | "Bank text";

/** Suggested QuickBooks Online Bank Rule so QBO auto-classifies pending/future feeds. */
export interface QboBankRuleSuggestion {
  id: string;
  contains: string;
  conditionField: QboBankRuleConditionField;
  qboAccountName: string;
  categoryId: BookkeepingCategoryId;
  moneyMovement: "money_out" | "money_in" | "either";
  supportCount: number;
  source: "learned_pattern" | "high_confidence" | "default_rule";
  ruleName: string;
}

export interface ConsolidatedTransactionLog {
  period: { start: string; end: string };
  generatedAt: string;
  companyId: string;
  companyName: string;
  accounts: AccountSource[];
  transactions: CategorizedTransaction[];
  totalsByCategory: Record<BookkeepingCategoryId, MoneyCents>;
  /** Transactions grouped by QBO COA for batch apply (instead of one-by-one). */
  qboBatches: QboCoaBatch[];
  unmatchedCount: number;
  openQuestionCount: number;
}

export interface ProfitAndLossLine {
  categoryId: BookkeepingCategoryId;
  label: string;
  qboAccountName?: string;
  amountCents: MoneyCents;
  kind: "income" | "cogs" | "expense" | "other";
}

export interface ProfitAndLossReport {
  period: { start: string; end: string };
  currency: string;
  companyId?: string;
  companyName?: string;
  incomeCents: MoneyCents;
  cogsCents: MoneyCents;
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
  companyId: string;
  companyName: string;
  summaryMarkdown: string;
  consolidatedCsv: string;
  /** Grouped by Chart of Account for applying categories in QBO in batches. */
  qboCoaApplyCsv: string;
  qboCoaApplyMarkdown: string;
  /** Bank Rules to install in QBO so pending/future feeds auto-classify. */
  qboBankRulesCsv: string;
  qboBankRulesMarkdown: string;
  profitAndLossCsv: string;
  openItemsMarkdown: string;
  categoryTotals: Record<BookkeepingCategoryId, MoneyCents>;
}

export interface BookkeeperRunInput {
  period: { start: string; end: string };
  companyId?: string;
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
  /** Install these in QBO → Rules so pending bank feed auto-classifies. */
  bankRules: QboBankRuleSuggestion[];
  handoffs: Array<AgentHandoffEnvelope<unknown>>;
  learnedPatterns: LearnedPattern[];
  companyId: string;
  companyName: string;
}
