import {
  emptyCategoryTotals,
  getCoaEntry,
  getCompanyProfile,
} from "./default-rules";
import type {
  AccountSource,
  BookkeepingCategoryId,
  CategorizedTransaction,
  CompanyProfile,
  ConsolidatedTransactionLog,
  MoneyCents,
  QboCoaBatch,
} from "./types";

export function buildQboCoaBatches(
  transactions: CategorizedTransaction[],
  profile: CompanyProfile,
): QboCoaBatch[] {
  const byAccount = new Map<string, CategorizedTransaction[]>();

  for (const txn of transactions) {
    const key = txn.qboAccountName || "Uncategorized Expense";
    const list = byAccount.get(key) ?? [];
    list.push(txn);
    byAccount.set(key, list);
  }

  return [...byAccount.entries()]
    .map(([qboAccountName, rows]) => {
      const categoryId = rows[0]?.categoryId ?? "uncategorized";
      const coa = getCoaEntry(profile, categoryId);
      const totalCents = rows.reduce((sum, txn) => sum + txn.amountCents, 0);
      return {
        qboAccountName,
        categoryId,
        accountType: coa?.accountType ?? "Other",
        transactionCount: rows.length,
        totalCents,
        transactions: rows.sort((a, b) => a.date.localeCompare(b.date)),
      };
    })
    .sort((a, b) => a.qboAccountName.localeCompare(b.qboAccountName));
}

export function buildConsolidatedLog(
  transactions: CategorizedTransaction[],
  period: { start: string; end: string },
  openQuestionCount: number,
  companyId?: string,
): ConsolidatedTransactionLog {
  const profile = getCompanyProfile(companyId);
  const inPeriod = transactions
    .filter((txn) => txn.date >= period.start && txn.date <= period.end)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.description.localeCompare(b.description);
    });

  const totalsByCategory = emptyCategoryTotals();
  const accountsById = new Map<string, AccountSource>();

  for (const txn of inPeriod) {
    totalsByCategory[txn.categoryId] += txn.amountCents;
    accountsById.set(txn.source.accountId, txn.source);
  }

  return {
    period,
    generatedAt: new Date().toISOString(),
    companyId: profile.id,
    companyName: profile.name,
    accounts: [...accountsById.values()],
    transactions: inPeriod,
    totalsByCategory,
    qboBatches: buildQboCoaBatches(inPeriod, profile),
    unmatchedCount: inPeriod.filter((txn) => txn.categoryId === "uncategorized")
      .length,
    openQuestionCount,
  };
}

export function consolidatedLogToCsv(log: ConsolidatedTransactionLog): string {
  const header = [
    "Date",
    "Bank Account",
    "Entity",
    "Description",
    "Payee",
    "Memo",
    "Amount",
    "Direction",
    "QBO Chart of Accounts",
    "Internal Category",
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
      txn.qboAccountName,
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

/** One row per transaction, sorted by QBO account so you can batch-apply in QBO. */
export function qboCoaApplyCsv(log: ConsolidatedTransactionLog): string {
  const header = [
    "QBO Chart of Accounts",
    "Account Type",
    "Date",
    "Bank Account",
    "Description",
    "Payee",
    "Amount",
    "Confidence",
    "Transaction Id",
  ];

  const lines = log.qboBatches.flatMap((batch) =>
    batch.transactions.map((txn) =>
      [
        batch.qboAccountName,
        batch.accountType,
        txn.date,
        txn.source.accountName,
        txn.description,
        txn.payee ?? "",
        (txn.amountCents / 100).toFixed(2),
        txn.confidence,
        txn.id,
      ]
        .map(csvEscape)
        .join(","),
    ),
  );

  return [header.join(","), ...lines].join("\n");
}

export function qboCoaApplyMarkdown(log: ConsolidatedTransactionLog): string {
  const sections = log.qboBatches.map((batch) => {
    const amount = formatMoney(batch.totalCents);
    const rows = batch.transactions
      .map(
        (txn) =>
          `- ${txn.date} · ${txn.source.accountName} · ${txn.description} · ${formatMoney(txn.amountCents)}`,
      )
      .join("\n");
    return `## ${batch.qboAccountName} (${batch.accountType})
${batch.transactionCount} transactions · net ${amount}

In QuickBooks Online → open each bank register (or For Review), filter/match these, and set **Category = ${batch.qboAccountName}**.

${rows}`;
  });

  return `# QBO Chart of Accounts batch apply — ${log.companyName}

Period: ${log.period.start} to ${log.period.end}

Instead of categorizing one-by-one across every account, work **by Chart of Accounts**: finish one QBO account bucket, then the next.

${sections.join("\n\n")}
`;
}

function formatMoney(cents: MoneyCents): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export type { BookkeepingCategoryId };
