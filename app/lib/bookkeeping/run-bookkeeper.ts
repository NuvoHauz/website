import { applyCategoryAnswers, categorizeTransactions } from "./categorize";
import { buildConsolidatedLog } from "./consolidate";
import { buildCpaDocumentationPack } from "./cpa-pack";
import {
  handoffToProfitAndLoss,
  handoffToReconciliation,
  handoffToTaxPrep,
} from "./agent-protocol";
import { getCompanyProfile } from "./default-rules";
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
  const profile = getCompanyProfile(input.companyId);
  const imported = input.imports.flatMap((entry) => {
    const batchId = entry.importBatchId ?? newBatchId();
    const source = {
      ...entry.source,
      entity: entry.source.entity ?? profile.name,
    };
    const parsed = parseQuickBooksCsv(entry.csvText, source, batchId);
    return parsed.transactions;
  });

  const { categorized, questions } = categorizeTransactions(imported, {
    companyId: profile.id,
    learnedPatterns: input.learnedPatterns,
    rules: input.extraRules,
  });

  return finalizeRun(
    categorized,
    questions,
    input.period,
    input.learnedPatterns ?? [],
    profile.id,
  );
}

export function continueBookkeeperWithAnswers(params: {
  categorized: CategorizedTransaction[];
  questions: CategorizationQuestion[];
  answers: CategoryAnswer[];
  period: { start: string; end: string };
  learnedPatterns?: LearnedPattern[];
  companyId?: string;
}): BookkeeperRunResult {
  const applied = applyCategoryAnswers(
    params.categorized,
    params.questions,
    params.answers,
    params.learnedPatterns ?? [],
    params.companyId,
  );

  return finalizeRun(
    applied.categorized,
    applied.questions,
    params.period,
    applied.learnedPatterns,
    applied.profile.id,
  );
}

function finalizeRun(
  categorized: CategorizedTransaction[],
  questions: CategorizationQuestion[],
  period: { start: string; end: string },
  learnedPatterns: LearnedPattern[],
  companyId: string,
): BookkeeperRunResult {
  const profile = getCompanyProfile(companyId);
  const log = buildConsolidatedLog(
    categorized,
    period,
    questions.length,
    profile.id,
  );
  const profitAndLoss = buildProfitAndLoss(log);
  const cpaPack = buildCpaDocumentationPack(log, profitAndLoss, questions);

  return {
    log,
    categorized,
    questions,
    profitAndLoss,
    cpaPack,
    learnedPatterns,
    companyId: profile.id,
    companyName: profile.name,
    handoffs: [
      handoffToProfitAndLoss(log),
      handoffToReconciliation(log),
      handoffToTaxPrep(cpaPack, profitAndLoss),
    ],
  };
}

export type { BookkeeperRunInput, BookkeeperRunResult };
