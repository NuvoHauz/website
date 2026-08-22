import { CATEGORY_LABELS, CATEGORY_OPTIONS, DEFAULT_CATEGORY_RULES } from "./default-rules";
import type {
  BookkeepingCategoryId,
  CategorizationQuestion,
  CategorizedTransaction,
  CategoryAnswer,
  CategoryConfidence,
  CategoryRule,
  ImportedTransaction,
  LearnedPattern,
} from "./types";

function haystack(txn: ImportedTransaction): string {
  return [txn.description, txn.memo, txn.payee]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function normalizeMerchant(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(pos|debit|credit|purchase|payment|ach|check|xfer)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 64);
}

function amountMatchesRule(
  amountCents: number,
  amountSign: CategoryRule["amountSign"],
): boolean {
  if (!amountSign || amountSign === "any") return true;
  if (amountSign === "positive") return amountCents > 0;
  return amountCents < 0;
}

function confidenceForRule(rule: CategoryRule): CategoryConfidence {
  if (rule.questionPrompt) return "needs_input";
  if (rule.priority >= 80) return "high";
  if (rule.priority >= 50) return "medium";
  return "low";
}

function findLearnedMatch(
  txn: ImportedTransaction,
  learned: LearnedPattern[],
): LearnedPattern | null {
  const merchant = normalizeMerchant(txn.description);
  if (!merchant) return null;
  return (
    learned.find((pattern) => {
      return (
        merchant.includes(pattern.normalizedMerchant) ||
        pattern.normalizedMerchant.includes(merchant)
      );
    }) ?? null
  );
}

function findRuleMatch(
  txn: ImportedTransaction,
  rules: CategoryRule[],
): { rule: CategoryRule; pattern: string } | null {
  const text = haystack(txn);
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    if (!amountMatchesRule(txn.amountCents, rule.amountSign)) continue;
    const pattern = rule.patterns.find((candidate) =>
      text.includes(candidate.toLowerCase()),
    );
    if (pattern) return { rule, pattern };
  }

  return null;
}

function buildQuestion(
  txn: ImportedTransaction,
  suggested?: BookkeepingCategoryId,
  evidence: string[] = [],
  customPrompt?: string,
): CategorizationQuestion {
  const prompt =
    customPrompt ??
    `How should we categorize “${txn.description}” (${formatMoney(txn.amountCents)}) on ${txn.date}?`;

  return {
    id: `q_${txn.id}`,
    transactionId: txn.id,
    prompt,
    options: CATEGORY_OPTIONS.filter((option) => option.value !== "uncategorized"),
    suggestedCategoryId: suggested,
    evidence,
  };
}

function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

export function categorizeTransactions(
  transactions: ImportedTransaction[],
  options?: {
    rules?: CategoryRule[];
    learnedPatterns?: LearnedPattern[];
  },
): {
  categorized: CategorizedTransaction[];
  questions: CategorizationQuestion[];
} {
  const rules = [...DEFAULT_CATEGORY_RULES, ...(options?.rules ?? [])];
  const learned = options?.learnedPatterns ?? [];
  const categorized: CategorizedTransaction[] = [];
  const questions: CategorizationQuestion[] = [];

  for (const txn of transactions) {
    const learnedMatch = findLearnedMatch(txn, learned);
    if (learnedMatch) {
      categorized.push({
        ...txn,
        categoryId: learnedMatch.categoryId,
        confidence: "high",
        matchedPattern: learnedMatch.normalizedMerchant,
        notes: "Matched learned merchant pattern",
      });
      continue;
    }

    const ruleMatch = findRuleMatch(txn, rules);
    if (!ruleMatch) {
      const question = buildQuestion(txn, undefined, ["No pattern matched"]);
      questions.push(question);
      categorized.push({
        ...txn,
        categoryId: "uncategorized",
        confidence: "needs_input",
        questionId: question.id,
      });
      continue;
    }

    const { rule, pattern } = ruleMatch;
    const confidence = confidenceForRule(rule);

    if (confidence === "needs_input" || confidence === "low") {
      const question = buildQuestion(
        txn,
        rule.categoryId,
        [`Matched pattern “${pattern}” via rule ${rule.id}`],
        rule.questionPrompt,
      );
      questions.push(question);
      categorized.push({
        ...txn,
        categoryId: rule.categoryId,
        confidence,
        matchedRuleId: rule.id,
        matchedPattern: pattern,
        questionId: question.id,
      });
      continue;
    }

    categorized.push({
      ...txn,
      categoryId: rule.categoryId,
      confidence,
      matchedRuleId: rule.id,
      matchedPattern: pattern,
    });
  }

  return { categorized, questions };
}

export function applyCategoryAnswers(
  categorized: CategorizedTransaction[],
  questions: CategorizationQuestion[],
  answers: CategoryAnswer[],
  learnedPatterns: LearnedPattern[] = [],
): {
  categorized: CategorizedTransaction[];
  questions: CategorizationQuestion[];
  learnedPatterns: LearnedPattern[];
} {
  const answerByTxn = new Map(answers.map((answer) => [answer.transactionId, answer]));
  const nextLearned = [...learnedPatterns];
  const remainingQuestions: CategorizationQuestion[] = [];

  const nextCategorized = categorized.map((txn) => {
    const answer = answerByTxn.get(txn.id);
    if (!answer) {
      if (txn.questionId) {
        const open = questions.find((question) => question.id === txn.questionId);
        if (open) remainingQuestions.push(open);
      }
      return txn;
    }

    if (answer.learnPattern !== false) {
      const merchant = normalizeMerchant(txn.description);
      if (merchant) {
        const exists = nextLearned.some(
          (pattern) =>
            pattern.normalizedMerchant === merchant &&
            pattern.categoryId === answer.categoryId,
        );
        if (!exists) {
          nextLearned.push({
            id: `learn_${txn.id}`,
            normalizedMerchant: merchant,
            categoryId: answer.categoryId,
            createdFromTransactionId: txn.id,
            answeredAt: new Date().toISOString(),
          });
        }
      }
    }

    return {
      ...txn,
      categoryId: answer.categoryId,
      confidence: "high" as const,
      questionId: undefined,
      notes: answer.note ?? `Confirmed as ${CATEGORY_LABELS[answer.categoryId]}`,
    };
  });

  return {
    categorized: nextCategorized,
    questions: remainingQuestions,
    learnedPatterns: nextLearned,
  };
}

export function identifyRecurringPatterns(
  transactions: CategorizedTransaction[],
): Array<{ merchant: string; count: number; categoryId: BookkeepingCategoryId }> {
  const counts = new Map<
    string,
    { merchant: string; count: number; categoryId: BookkeepingCategoryId }
  >();

  for (const txn of transactions) {
    const merchant = normalizeMerchant(txn.description);
    if (!merchant) continue;
    const key = `${merchant}|${txn.categoryId}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        merchant,
        count: 1,
        categoryId: txn.categoryId,
      });
    }
  }

  return [...counts.values()]
    .filter((entry) => entry.count >= 2)
    .sort((a, b) => b.count - a.count);
}
