import type {
  AccountSource,
  ImportedTransaction,
  TransactionDirection,
} from "./types";

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s/_-]+/g, " ")
    .replace(/[^a-z0-9 ]/g, "");
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current);
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current);
  if (row.some((cell) => cell.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function parseAmountToCents(raw: string): number | null {
  const cleaned = raw.replace(/[$\s,]/g, "").trim();
  if (!cleaned || cleaned === "-" || cleaned === "--") return null;

  const negativeParens = /^\(.*\)$/.test(cleaned);
  const numeric = Number(cleaned.replace(/[()]/g, ""));
  if (!Number.isFinite(numeric)) return null;

  const cents = Math.round(Math.abs(numeric) * 100);
  const signed = numeric < 0 || negativeParens ? -cents : cents;
  return signed;
}

function parseQuickBooksDate(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(value);
  if (us) {
    const month = us[1].padStart(2, "0");
    const day = us[2].padStart(2, "0");
    let year = us[3];
    if (year.length === 2) {
      year = Number(year) >= 70 ? `19${year}` : `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const y = parsed.getUTCFullYear();
  const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const d = String(parsed.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function findColumn(
  headers: string[],
  candidates: string[],
): number {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const index = normalized.indexOf(normalizeHeader(candidate));
    if (index >= 0) return index;
  }
  return -1;
}

function directionFromAmount(amountCents: number): TransactionDirection {
  if (amountCents > 0) return "inflow";
  if (amountCents < 0) return "outflow";
  return "transfer";
}

function stableId(
  source: AccountSource,
  date: string,
  description: string,
  amountCents: number,
  index: number,
): string {
  const base = `${source.accountId}|${date}|${description}|${amountCents}|${index}`;
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  }
  return `txn_${hash.toString(16)}_${index}`;
}

export interface ParseQuickBooksCsvResult {
  transactions: ImportedTransaction[];
  skippedRows: number;
  detectedColumns: string[];
}

/**
 * Parses common QuickBooks Online / Desktop transaction CSV exports.
 * Supports Amount column, or separate Debit/Credit columns.
 */
export function parseQuickBooksCsv(
  csvText: string,
  source: AccountSource,
  importBatchId: string,
): ParseQuickBooksCsvResult {
  const rows = parseCsvRows(csvText.replace(/^\uFEFF/, ""));
  if (rows.length < 2) {
    return { transactions: [], skippedRows: 0, detectedColumns: [] };
  }

  const headers = rows[0];
  const dateIdx = findColumn(headers, ["date", "transaction date"]);
  const payeeIdx = findColumn(headers, ["name", "payee", "vendor"]);
  const descIdx = findColumn(headers, [
    "description",
    "memo/description",
    "memo",
    "name",
    "payee",
  ]);
  const memoIdx = findColumn(headers, ["memo", "memo/description", "notes"]);
  const amountIdx = findColumn(headers, ["amount", "spent", "received"]);
  const debitIdx = findColumn(headers, ["debit", "money out", "withdrawal"]);
  const creditIdx = findColumn(headers, ["credit", "money in", "deposit"]);

  if (dateIdx < 0 || (amountIdx < 0 && debitIdx < 0 && creditIdx < 0)) {
    throw new Error(
      "Unrecognized QuickBooks CSV headers. Expected Date plus Amount or Debit/Credit.",
    );
  }

  const transactions: ImportedTransaction[] = [];
  let skippedRows = 0;

  for (let i = 1; i < rows.length; i += 1) {
    const cells = rows[i];
    const raw: Record<string, string> = {};
    headers.forEach((header, idx) => {
      raw[header] = cells[idx] ?? "";
    });

    const date = parseQuickBooksDate(cells[dateIdx] ?? "");
    if (!date) {
      skippedRows += 1;
      continue;
    }

    let amountCents: number | null = null;
    if (amountIdx >= 0) {
      amountCents = parseAmountToCents(cells[amountIdx] ?? "");
    } else {
      const debit = parseAmountToCents(cells[debitIdx] ?? "") ?? 0;
      const credit = parseAmountToCents(cells[creditIdx] ?? "") ?? 0;
      if (debit === 0 && credit === 0) {
        skippedRows += 1;
        continue;
      }
      amountCents = credit - Math.abs(debit);
    }

    if (amountCents === null || amountCents === 0) {
      skippedRows += 1;
      continue;
    }

    const payee = payeeIdx >= 0 ? cells[payeeIdx]?.trim() || undefined : undefined;
    const memo = memoIdx >= 0 ? cells[memoIdx]?.trim() || undefined : undefined;
    const description =
      payee ||
      (descIdx >= 0 ? cells[descIdx] : "")?.trim() ||
      memo ||
      "Untitled transaction";

    transactions.push({
      id: stableId(source, date, description, amountCents, i),
      source,
      date,
      description,
      memo,
      payee,
      amountCents,
      direction: directionFromAmount(amountCents),
      raw,
      importBatchId,
    });
  }

  return {
    transactions,
    skippedRows,
    detectedColumns: headers,
  };
}
