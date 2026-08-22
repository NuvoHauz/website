import type {
  AccountSource,
  BookkeepingCategoryId,
  CategorizedTransaction,
  ConsolidatedTransactionLog,
  MoneyCents,
} from "./types";

function emptyTotals(): Record<BookkeepingCategoryId, MoneyCents> {
  return {
    rental_income: 0,
    platform_fees: 0,
    cleaning: 0,
    supplies: 0,
    repairs_maintenance: 0,
    utilities: 0,
    insurance: 0,
    property_management: 0,
    mortgage_loan: 0,
    hoa_fees: 0,
    professional_fees: 0,
    advertising: 0,
    owner_travel: 0,
    taxes_licenses: 0,
    bank_fees: 0,
    transfer: 0,
    owner_draw: 0,
    personal: 0,
    uncategorized: 0,
  };
}

export function buildConsolidatedLog(
  transactions: CategorizedTransaction[],
  period: { start: string; end: string },
  openQuestionCount: number,
): ConsolidatedTransactionLog {
  const inPeriod = transactions
    .filter((txn) => txn.date >= period.start && txn.date <= period.end)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.description.localeCompare(b.description);
    });

  const totalsByCategory = emptyTotals();
  const accountsById = new Map<string, AccountSource>();

  for (const txn of inPeriod) {
    totalsByCategory[txn.categoryId] += txn.amountCents;
    accountsById.set(txn.source.accountId, txn.source);
  }

  return {
    period,
    generatedAt: new Date().toISOString(),
    accounts: [...accountsById.values()],
    transactions: inPeriod,
    totalsByCategory,
    unmatchedCount: inPeriod.filter((txn) => txn.categoryId === "uncategorized")
      .length,
    openQuestionCount,
  };
}

export function consolidatedLogToCsv(log: ConsolidatedTransactionLog): string {
  const header = [
    "Date",
    "Account",
    "Entity",
    "Description",
    "Payee",
    "Memo",
    "Amount",
    "Direction",
    "Category",
    "Confidence",
    "Matched Pattern",
    "Notes",
    "Transaction Id",
  ];

  const lines = log.transactions.map((txn) =>
    [
      txn.date,
      txn.source.accountName,
      txn.source.entity ?? "",
      txn.description,
      txn.payee ?? "",
      txn.memo ?? "",
      (txn.amountCents / 100).toFixed(2),
      txn.direction,
      txn.categoryId,
      txn.confidence,
      txn.matchedPattern ?? "",
      txn.notes ?? "",
      txn.id,
    ]
      .map(csvEscape)
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
