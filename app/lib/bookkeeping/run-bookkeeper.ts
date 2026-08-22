import { applyCategoryAnswers, categorizeTransactions } from "./categorize";
import { buildConsolidatedLog } from "./consolidate";
import { buildCpaDocumentationPack } from "./cpa-pack";
import {
  handoffToProfitAndLoss,
  handoffToReconciliation,
  handoffToTaxPrep,
} from "./agent-protocol";
import { parseQuickBooksCsv } from "./parse-quickbooks-csv";
import { buildProfitAndLoss } from "./profit-and-loss";
import type {
  BookkeeperRunInput,
  BookkeeperRunResult,
  CategorizationQuestion,
  CategorizedTransaction,
  CategoryAnswer,
  LearnedPattern,
} from "./types";

function newBatchId(): string {
  return `batch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function runBookkeeper(input: BookkeeperRunInput): BookkeeperRunResult {
  const imported = input.imports.flatMap((entry) => {
    const batchId = entry.importBatchId ?? newBatchId();
    const parsed = parseQuickBooksCsv(entry.csvText, entry.source, batchId);
    return parsed.transactions;
  });

  const { categorized, questions } = categorizeTransactions(imported, {
    learnedPatterns: input.learnedPatterns,
    rules: input.extraRules,
  });

  return finalizeRun(
    categorized,
    questions,
    input.period,
    input.learnedPatterns ?? [],
  );
}

export function continueBookkeeperWithAnswers(params: {
  categorized: CategorizedTransaction[];
  questions: CategorizationQuestion[];
  answers: CategoryAnswer[];
  period: { start: string; end: string };
  learnedPatterns?: LearnedPattern[];
}): BookkeeperRunResult {
  const applied = applyCategoryAnswers(
    params.categorized,
    params.questions,
    params.answers,
    params.learnedPatterns ?? [],
  );

  return finalizeRun(
    applied.categorized,
    applied.questions,
    params.period,
    applied.learnedPatterns,
  );
}

function finalizeRun(
  categorized: CategorizedTransaction[],
  questions: CategorizationQuestion[],
  period: { start: string; end: string },
  learnedPatterns: LearnedPattern[],
): BookkeeperRunResult {
  const log = buildConsolidatedLog(categorized, period, questions.length);
  const profitAndLoss = buildProfitAndLoss(log);
  const cpaPack = buildCpaDocumentationPack(log, profitAndLoss, questions);

  return {
    log,
    categorized,
    questions,
    profitAndLoss,
    cpaPack,
    learnedPatterns,
    handoffs: [
      handoffToProfitAndLoss(log),
      handoffToReconciliation(log),
      handoffToTaxPrep(cpaPack, profitAndLoss),
    ],
  };
}

export type { BookkeeperRunInput, BookkeeperRunResult };
