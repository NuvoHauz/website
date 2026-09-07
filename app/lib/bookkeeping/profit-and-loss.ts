import { CATEGORY_LABELS, getCompanyProfile, getCoaEntry } from "./default-rules";
import type {
  BookkeepingCategoryId,
  ConsolidatedTransactionLog,
  ProfitAndLossLine,
  ProfitAndLossReport,
} from "./types";

/**
 * P&L specialist: builds a statement from the consolidated bookkeeper log
 * using the company file's Chart of Accounts sections (income / COGS / expense).
 */
export function buildProfitAndLoss(
  log: ConsolidatedTransactionLog,
  currency = "USD",
): ProfitAndLossReport {
  const profile = getCompanyProfile(log.companyId);
  const lines: ProfitAndLossLine[] = [];

  let incomeCents = 0;
  let cogsCents = 0;
  let expenseCents = 0;

  const categoryIds = Object.keys(log.totalsByCategory) as BookkeepingCategoryId[];

  for (const categoryId of categoryIds) {
    const coa = getCoaEntry(profile, categoryId);
    const section = coa?.plSection ?? "other";

    if (section === "income") {
      const amountCents = sumAbsoluteIncome(log, categoryId);
      if (amountCents === 0) continue;
      incomeCents += amountCents;
      lines.push({
        categoryId,
        label: CATEGORY_LABELS[categoryId],
        qboAccountName: coa?.qboAccountName,
        amountCents,
        kind: "income",
      });
      continue;
    }

    if (section === "cogs" || section === "expense") {
      const amountCents = sumAbsoluteExpense(log, categoryId);
      if (amountCents === 0) continue;
      if (section === "cogs") cogsCents += amountCents;
      else expenseCents += amountCents;
      lines.push({
        categoryId,
        label: CATEGORY_LABELS[categoryId],
        qboAccountName: coa?.qboAccountName,
        amountCents,
        kind: section,
      });
      continue;
    }

    const amountCents = log.totalsByCategory[categoryId] ?? 0;
    if (amountCents === 0) continue;
    lines.push({
      categoryId,
      label: CATEGORY_LABELS[categoryId],
      qboAccountName: coa?.qboAccountName,
      amountCents,
      kind: "other",
    });
  }

  const operatingExpenseCents = cogsCents + expenseCents;

  return {
    period: log.period,
    currency,
    companyId: log.companyId,
    companyName: log.companyName,
    incomeCents,
    cogsCents,
    expenseCents,
    netCents: incomeCents - operatingExpenseCents,
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
    ["Section", "QBO Account", "Category", "Amount"].join(","),
    ...report.lines.map((line) =>
      [
        line.kind,
        line.qboAccountName ?? "",
        line.label,
        (line.amountCents / 100).toFixed(2),
      ].join(","),
    ),
    ["totals", "", "Income", (report.incomeCents / 100).toFixed(2)].join(","),
    ["totals", "", "COGS", (report.cogsCents / 100).toFixed(2)].join(","),
    ["totals", "", "Expenses", (report.expenseCents / 100).toFixed(2)].join(","),
    ["totals", "", "Net operating", (report.netCents / 100).toFixed(2)].join(","),
  ];
  return rows.join("\n");
}

/** Adapter hook so other accounting systems can map into our P&L shape later. */
export interface ExternalLedgerAdapter {
  systemName: string;
  toConsolidatedLog: (raw: unknown) => ConsolidatedTransactionLog;
}
