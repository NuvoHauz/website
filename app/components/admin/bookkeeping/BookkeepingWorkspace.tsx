"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  COMPANY_PROFILES,
  DEFAULT_COMPANY_ID,
} from "../../../lib/bookkeeping/default-rules";
import type {
  BookkeeperRunResult,
  BookkeepingCategoryId,
  CategoryAnswer,
  LearnedPattern,
} from "../../../lib/bookkeeping/types";

type ImportDraft = {
  id: string;
  accountId: string;
  accountName: string;
  entity: string;
  fileName: string;
  csvText: string;
};

function money(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

function downloadText(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function defaultPeriod(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function patternsKey(companyId: string) {
  return `nuvohauz.bookkeeping.learnedPatterns.${companyId}`;
}

function readLearnedPatterns(companyId: string): LearnedPattern[] {
  try {
    const raw = window.localStorage.getItem(patternsKey(companyId));
    if (!raw) return [];
    return JSON.parse(raw) as LearnedPattern[];
  } catch {
    return [];
  }
}

function writeLearnedPatterns(companyId: string, patterns: LearnedPattern[]) {
  window.localStorage.setItem(patternsKey(companyId), JSON.stringify(patterns));
}

export default function BookkeepingWorkspace() {
  const router = useRouter();
  const initialPeriod = useMemo(() => defaultPeriod(), []);
  const [companyId, setCompanyId] = useState(DEFAULT_COMPANY_ID);
  const companyName =
    COMPANY_PROFILES.find((profile) => profile.id === companyId)?.name ??
    "Alfa Renovations";
  const [periodStart, setPeriodStart] = useState(initialPeriod.start);
  const [periodEnd, setPeriodEnd] = useState(initialPeriod.end);
  const [imports, setImports] = useState<ImportDraft[]>([
    {
      id: "import_1",
      accountId: "checking",
      accountName: "Operating Checking",
      entity: "Alfa Renovations",
      fileName: "",
      csvText: "",
    },
  ]);
  const [result, setResult] = useState<BookkeeperRunResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, BookkeepingCategoryId>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPickFile(importId: string, file: File | null) {
    if (!file) return;
    const csvText = await file.text();
    setImports((current) =>
      current.map((entry) =>
        entry.id === importId
          ? { ...entry, fileName: file.name, csvText }
          : entry,
      ),
    );
  }

  function addAccount() {
    setImports((current) => [
      ...current,
      {
        id: `import_${current.length + 1}_${Date.now()}`,
        accountId: `account_${current.length + 1}`,
        accountName: `Account ${current.length + 1}`,
        entity: companyName,
        fileName: "",
        csvText: "",
      },
    ]);
  }

  async function processImports() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/bookkeeping/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process",
          companyId,
          period: { start: periodStart, end: periodEnd },
          learnedPatterns: readLearnedPatterns(companyId),
          imports: imports.map((entry) => ({
            accountId: entry.accountId,
            accountName: entry.accountName,
            entity: entry.entity || companyName,
            csvText: entry.csvText,
          })),
        }),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const payload = (await response.json()) as BookkeeperRunResult & {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(payload.message ?? payload.error ?? "Unable to process imports.");
        return;
      }

      setResult(payload);
      setAnswers({});
      writeLearnedPatterns(companyId, payload.learnedPatterns);
    } catch {
      setError("Unable to process imports.");
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswers() {
    if (!result) return;
    setBusy(true);
    setError(null);

    try {
      const answerList: CategoryAnswer[] = result.questions
        .filter((question) => answers[question.transactionId])
        .map((question) => ({
          questionId: question.id,
          transactionId: question.transactionId,
          categoryId: answers[question.transactionId],
          learnPattern: true,
        }));

      if (answerList.length === 0) {
        setError("Select a Chart of Accounts category for at least one question.");
        setBusy(false);
        return;
      }

      const response = await fetch("/api/admin/bookkeeping/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          companyId,
          period: { start: periodStart, end: periodEnd },
          categorized: result.categorized,
          questions: result.questions,
          answers: answerList,
          learnedPatterns: result.learnedPatterns,
        }),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const payload = (await response.json()) as BookkeeperRunResult & {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(payload.message ?? payload.error ?? "Unable to apply answers.");
        return;
      }

      setResult(payload);
      setAnswers({});
      writeLearnedPatterns(companyId, payload.learnedPatterns);
    } catch {
      setError("Unable to apply answers.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[#111111]/10 bg-white p-5 sm:p-6">
        <h2 className="font-serif text-2xl font-light text-[#111111]">
          Automate QBO pending classification
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#111111]/70">
          Those pending counts on Forum, Amex, and other linked accounts are already
          in QuickBooks. Intuit does not let apps categorize For review via API.
          This tool learns merchants and builds <strong>Bank Rules</strong> you
          install once in QBO — then QuickBooks classifies matching pending and
          future transactions for you.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm sm:col-span-1">
            <span className="text-[#111111]/60">QBO company file</span>
            <select
              value={companyId}
              onChange={(event) => {
                setCompanyId(event.target.value);
                setResult(null);
                setImports((current) =>
                  current.map((row) => ({
                    ...row,
                    entity:
                      COMPANY_PROFILES.find((profile) => profile.id === event.target.value)
                        ?.name ?? row.entity,
                  })),
                );
              }}
              className="mt-1 w-full rounded-xl border border-[#111111]/15 bg-[#F8F6F2] px-3 py-2.5"
            >
              {COMPANY_PROFILES.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[#111111]/60">Period start</span>
            <input
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
              className="mt-1 w-full rounded-xl border border-[#111111]/15 bg-[#F8F6F2] px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#111111]/60">Period end</span>
            <input
              type="date"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
              className="mt-1 w-full rounded-xl border border-[#111111]/15 bg-[#F8F6F2] px-3 py-2.5"
            />
          </label>
        </div>

        <div className="mt-6 space-y-4">
          {imports.map((entry) => (
            <div
              key={entry.id}
              className="grid gap-3 rounded-xl border border-[#111111]/08 bg-[#F8F6F2]/70 p-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <label className="block text-sm">
                <span className="text-[#111111]/60">Account id</span>
                <input
                  value={entry.accountId}
                  onChange={(event) =>
                    setImports((current) =>
                      current.map((row) =>
                        row.id === entry.id
                          ? { ...row, accountId: event.target.value }
                          : row,
                      ),
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-[#111111]/15 bg-white px-3 py-2.5"
                />
              </label>
              <label className="block text-sm">
                <span className="text-[#111111]/60">Bank / card account name</span>
                <input
                  value={entry.accountName}
                  onChange={(event) =>
                    setImports((current) =>
                      current.map((row) =>
                        row.id === entry.id
                          ? { ...row, accountName: event.target.value }
                          : row,
                      ),
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-[#111111]/15 bg-white px-3 py-2.5"
                />
              </label>
              <label className="block text-sm">
                <span className="text-[#111111]/60">Company file</span>
                <input
                  value={entry.entity}
                  onChange={(event) =>
                    setImports((current) =>
                      current.map((row) =>
                        row.id === entry.id
                          ? { ...row, entity: event.target.value }
                          : row,
                      ),
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-[#111111]/15 bg-white px-3 py-2.5"
                />
              </label>
              <label className="block text-sm">
                <span className="text-[#111111]/60">QBO transaction CSV</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) =>
                    void onPickFile(entry.id, event.target.files?.[0] ?? null)
                  }
                  className="mt-1 w-full text-sm"
                />
                {entry.fileName ? (
                  <p className="mt-1 text-xs text-[#1B3D32]">{entry.fileName}</p>
                ) : null}
              </label>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addAccount}
            className="inline-flex min-h-[44px] items-center rounded-full border border-[#111111]/20 px-5 py-2.5 text-sm"
          >
            Add another bank/card account
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void processImports()}
            className="inline-flex min-h-[44px] items-center rounded-full bg-[#1B3D32] px-5 py-2.5 text-sm text-white disabled:opacity-60"
          >
            {busy ? "Working…" : "Build automation rules"}
          </button>
        </div>
      </section>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {result ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Transactions scanned", String(result.log.transactions.length)],
              ["Bank rules ready", String(result.bankRules.length)],
              ["Edge-case questions", String(result.questions.length)],
              ["Net operating", money(result.profitAndLoss.netCents)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-[#111111]/10 bg-white p-5"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-[#111111]/45">
                  {label}
                </p>
                <p className="mt-3 font-serif text-3xl font-light text-[#111111]">
                  {value}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-[#111111]/10 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-light">
                  QBO Bank Rules (this is the automation)
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-[#111111]/70">
                  Install these in QuickBooks → Bookkeeping → Rules. Enable{" "}
                  <strong>Also apply to transactions waiting for review</strong> so
                  current pending on Forum / Amex / etc. get classified by QBO.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadText(
                      `qbo-bank-rules-${companyId}-${periodStart}-${periodEnd}.csv`,
                      result.cpaPack.qboBankRulesCsv,
                      "text/csv",
                    )
                  }
                  className="rounded-full border border-[#111111]/20 px-4 py-2 text-sm"
                >
                  Download rules CSV
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadText(
                      `qbo-bank-rules-setup-${companyId}-${periodStart}-${periodEnd}.md`,
                      result.cpaPack.qboBankRulesMarkdown,
                      "text/markdown",
                    )
                  }
                  className="rounded-full bg-[#1B3D32] px-4 py-2 text-sm text-white"
                >
                  Download setup guide
                </button>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#111111]/10 text-xs uppercase tracking-[0.16em] text-[#111111]/45">
                  <tr>
                    <th className="px-2 py-3 font-medium">When bank text contains</th>
                    <th className="px-2 py-3 font-medium">Assign QBO account</th>
                    <th className="px-2 py-3 font-medium">Money</th>
                    <th className="px-2 py-3 font-medium">Support</th>
                  </tr>
                </thead>
                <tbody>
                  {result.bankRules.slice(0, 40).map((rule) => (
                    <tr key={rule.id} className="border-b border-[#111111]/05">
                      <td className="px-2 py-3 font-mono text-xs">{rule.contains}</td>
                      <td className="px-2 py-3">{rule.qboAccountName}</td>
                      <td className="px-2 py-3">{rule.moneyMovement.replace("_", " ")}</td>
                      <td className="px-2 py-3">{rule.supportCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-[#111111]/10 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-light">
                  Apply by Chart of Accounts (not one-by-one)
                </h2>
                <p className="mt-2 text-sm text-[#111111]/70">
                  Optional fallback while rules are being installed. Prefer Bank Rules
                  above so QBO does the work.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadText(
                      `qbo-coa-apply-${companyId}-${periodStart}-${periodEnd}.csv`,
                      result.cpaPack.qboCoaApplyCsv,
                      "text/csv",
                    )
                  }
                  className="rounded-full border border-[#111111]/20 px-4 py-2 text-sm"
                >
                  Download COA apply CSV
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadText(
                      `qbo-coa-guide-${companyId}-${periodStart}-${periodEnd}.md`,
                      result.cpaPack.qboCoaApplyMarkdown,
                      "text/markdown",
                    )
                  }
                  className="rounded-full bg-[#1B3D32] px-4 py-2 text-sm text-white"
                >
                  Download QBO apply guide
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {result.log.qboBatches.map((batch) => (
                <details
                  key={batch.qboAccountName}
                  className="rounded-xl border border-[#111111]/08 bg-[#F8F6F2]/70 p-4"
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium text-[#1B3D32]">
                        {batch.qboAccountName}
                        <span className="ml-2 text-xs font-normal text-[#111111]/50">
                          {batch.accountType}
                        </span>
                      </p>
                      <p className="text-sm text-[#111111]/70">
                        {batch.transactionCount} txn
                        {batch.transactionCount === 1 ? "" : "s"} · {money(batch.totalCents)}
                      </p>
                    </div>
                  </summary>
                  <ul className="mt-3 space-y-2 text-sm text-[#111111]/80">
                    {batch.transactions.map((txn) => (
                      <li key={txn.id}>
                        {txn.date} · {txn.source.accountName} · {txn.description} ·{" "}
                        {money(txn.amountCents)}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          {result.questions.length > 0 ? (
            <section className="rounded-2xl border border-[#111111]/10 bg-white p-5 sm:p-6">
              <h2 className="font-serif text-2xl font-light">
                Chart of Accounts questions
              </h2>
              <p className="mt-2 text-sm text-[#111111]/70">
                Only the unclear rows. Answers teach the agent merchant → COA
                patterns for {companyName}.
              </p>
              <div className="mt-5 space-y-4">
                {result.questions.map((question) => (
                  <div
                    key={question.id}
                    className="rounded-xl border border-[#111111]/08 bg-[#F8F6F2]/70 p-4"
                  >
                    <p className="text-sm text-[#111111]">{question.prompt}</p>
                    {question.evidence.length > 0 ? (
                      <p className="mt-1 text-xs text-[#111111]/50">
                        {question.evidence.join(" · ")}
                      </p>
                    ) : null}
                    <select
                      className="mt-3 w-full rounded-xl border border-[#111111]/15 bg-white px-3 py-2.5 text-sm"
                      value={answers[question.transactionId] ?? ""}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [question.transactionId]: event.target
                            .value as BookkeepingCategoryId,
                        }))
                      }
                    >
                      <option value="">Select QBO account…</option>
                      {question.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitAnswers()}
                className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-[#C69C6D] px-5 py-2.5 text-sm text-[#111111] disabled:opacity-60"
              >
                Apply answers & learn patterns
              </button>
            </section>
          ) : null}

          <section className="rounded-2xl border border-[#111111]/10 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-light">
                  Consolidated transaction log
                </h2>
                <p className="mt-2 text-sm text-[#111111]/70">
                  {result.companyName} · monthly recon &amp; CPA review
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadText(
                      `consolidated-${companyId}-${periodStart}-${periodEnd}.csv`,
                      result.cpaPack.consolidatedCsv,
                      "text/csv",
                    )
                  }
                  className="rounded-full border border-[#111111]/20 px-4 py-2 text-sm"
                >
                  Download CSV
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadText(
                      `pnl-${companyId}-${periodStart}-${periodEnd}.csv`,
                      result.cpaPack.profitAndLossCsv,
                      "text/csv",
                    )
                  }
                  className="rounded-full border border-[#111111]/20 px-4 py-2 text-sm"
                >
                  Download P&L
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadText(
                      `cpa-pack-${companyId}-${periodStart}-${periodEnd}.md`,
                      `${result.cpaPack.summaryMarkdown}\n${result.cpaPack.qboBankRulesMarkdown}\n${result.cpaPack.openItemsMarkdown}`,
                      "text/markdown",
                    )
                  }
                  className="rounded-full bg-[#1B3D32] px-4 py-2 text-sm text-white"
                >
                  Download CPA pack
                </button>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#111111]/10 text-xs uppercase tracking-[0.16em] text-[#111111]/45">
                  <tr>
                    <th className="px-2 py-3 font-medium">Date</th>
                    <th className="px-2 py-3 font-medium">Bank account</th>
                    <th className="px-2 py-3 font-medium">Description</th>
                    <th className="px-2 py-3 font-medium">QBO COA</th>
                    <th className="px-2 py-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {result.log.transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-[#111111]/05">
                      <td className="px-2 py-3 whitespace-nowrap">{txn.date}</td>
                      <td className="px-2 py-3">{txn.source.accountName}</td>
                      <td className="px-2 py-3">{txn.description}</td>
                      <td className="px-2 py-3">
                        {txn.qboAccountName}
                        <span className="ml-2 text-xs text-[#111111]/40">
                          {txn.confidence}
                        </span>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        {money(txn.amountCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-[#111111]/10 bg-white p-5 sm:p-6">
            <h2 className="font-serif text-2xl font-light">Specialist agent handoffs</h2>
            <p className="mt-2 text-sm text-[#111111]/70">
              Structured packages for P&amp;L, reconciliation, and tax-prep agents.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {result.handoffs.map((handoff) => (
                <li
                  key={`${handoff.from}-${handoff.to}-${handoff.purpose}`}
                  className="rounded-xl bg-[#F8F6F2] px-4 py-3"
                >
                  <span className="font-medium text-[#1B3D32]">
                    {handoff.from} → {handoff.to}
                  </span>
                  <span className="text-[#111111]/70"> — {handoff.purpose}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
