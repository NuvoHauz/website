import { CATEGORY_LABELS } from "./default-rules";
import type {
  BookkeepingCategoryId,
  ConsolidatedTransactionLog,
  ProfitAndLossLine,
  ProfitAndLossReport,
} from "./types";

const INCOME_CATEGORIES: BookkeepingCategoryId[] = ["rental_income"];

const EXPENSE_CATEGORIES: BookkeepingCategoryId[] = [
  "platform_fees",
  "cleaning",
  "supplies",
  "repairs_maintenance",
  "utilities",
  "insurance",
  "property_management",
  "hoa_fees",
  "professional_fees",
  "advertising",
  "owner_travel",
  "taxes_licenses",
  "bank_fees",
];

const OTHER_CATEGORIES: BookkeepingCategoryId[] = [
  "mortgage_loan",
  "transfer",
  "owner_draw",
  "personal",
  "uncategorized",
];

/**
 * P&L specialist: builds a statement from the consolidated bookkeeper log.
 * Designed so another agent (or accounting system adapter) can consume the same shape.
 */
export function buildProfitAndLoss(
  log: ConsolidatedTransactionLog,
  currency = "USD",
): ProfitAndLossReport {
  const lines: ProfitAndLossLine[] = [];

  let incomeCents = 0;
  for (const categoryId of INCOME_CATEGORIES) {
    const amountCents = sumAbsoluteIncome(log, categoryId);
    incomeCents += amountCents;
    lines.push({
      categoryId,
      label: CATEGORY_LABELS[categoryId],
      amountCents,
      kind: "income",
    });
  }

  let expenseCents = 0;
  for (const categoryId of EXPENSE_CATEGORIES) {
    const amountCents = sumAbsoluteExpense(log, categoryId);
    if (amountCents === 0) continue;
    expenseCents += amountCents;
    lines.push({
      categoryId,
      label: CATEGORY_LABELS[categoryId],
      amountCents,
      kind: "expense",
    });
  }

  for (const categoryId of OTHER_CATEGORIES) {
    const amountCents = log.totalsByCategory[categoryId] ?? 0;
    if (amountCents === 0) continue;
    lines.push({
      categoryId,
      label: CATEGORY_LABELS[categoryId],
      amountCents,
      kind: "other",
    });
  }

  return {
    period: log.period,
    currency,
    incomeCents,
    expenseCents,
    netCents: incomeCents - expenseCents,
    lines,
    producedBy: "profit_and_loss",
  };
}

function sumAbsoluteIncome(
  log: ConsolidatedTransactionLog,
  categoryId: BookkeepingCategoryId,
): number {
  return log.transactions
    .filter((txn) => txn.categoryId === categoryId && txn.amountCents > 0)
    .reduce((sum, txn) => sum + txn.amountCents, 0);
}

function sumAbsoluteExpense(
  log: ConsolidatedTransactionLog,
  categoryId: BookkeepingCategoryId,
): number {
  return log.transactions
    .filter((txn) => txn.categoryId === categoryId && txn.amountCents < 0)
    .reduce((sum, txn) => sum + Math.abs(txn.amountCents), 0);
}

export function profitAndLossToCsv(report: ProfitAndLossReport): string {
  const rows = [
    ["Section", "Category", "Amount"].join(","),
    ...report.lines.map((line) =>
      [line.kind, line.label, (line.amountCents / 100).toFixed(2)].join(","),
    ),
    ["totals", "Income", (report.incomeCents / 100).toFixed(2)].join(","),
    ["totals", "Expenses", (report.expenseCents / 100).toFixed(2)].join(","),
    ["totals", "Net operating", (report.netCents / 100).toFixed(2)].join(","),
  ];
  return rows.join("\n");
}

/** Adapter hook so other accounting systems can map into our P&L shape later. */
export interface ExternalLedgerAdapter {
  systemName: string;
  toConsolidatedLog: (raw: unknown) => ConsolidatedTransactionLog;
}
