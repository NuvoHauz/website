import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  getCompanyProfile,
  resolveQboAccountName,
  SHARED_CATEGORY_RULES,
} from "./default-rules";
import type {
  BookkeepingCategoryId,
  CategorizationQuestion,
  CategorizedTransaction,
  CategoryAnswer,
  CategoryConfidence,
  CategoryRule,
  CompanyProfile,
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
  companyId: string,
): LearnedPattern | null {
  const merchant = normalizeMerchant(txn.description);
  if (!merchant) return null;
  return (
    learned.find((pattern) => {
      if (pattern.companyId && pattern.companyId !== companyId) return false;
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

function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

function buildQuestion(
  txn: ImportedTransaction,
  profile: CompanyProfile,
  suggested?: BookkeepingCategoryId,
  evidence: string[] = [],
  customPrompt?: string,
): CategorizationQuestion {
  const suggestedCoa = suggested
    ? resolveQboAccountName(profile, suggested)
    : undefined;
  const prompt =
    customPrompt ??
    `Which ${profile.name} Chart of Accounts category should “${txn.description}” (${formatMoney(txn.amountCents)}) on ${txn.date} use?`;

  return {
    id: `q_${txn.id}`,
    transactionId: txn.id,
    prompt: suggestedCoa
      ? `${prompt} Suggested QBO account: ${suggestedCoa}.`
      : prompt,
    options: CATEGORY_OPTIONS.filter((option) => option.value !== "uncategorized").map(
      (option) => ({
        value: option.value,
        label: `${resolveQboAccountName(profile, option.value)} (${CATEGORY_LABELS[option.value]})`,
      }),
    ),
    suggestedCategoryId: suggested,
    evidence,
  };
}

function withCoa(
  txn: ImportedTransaction,
  profile: CompanyProfile,
  categoryId: BookkeepingCategoryId,
  rest: Omit<CategorizedTransaction, keyof ImportedTransaction | "categoryId" | "qboAccountName">,
): CategorizedTransaction {
  return {
    ...txn,
    categoryId,
    qboAccountName: resolveQboAccountName(profile, categoryId),
    ...rest,
  };
}

export function categorizeTransactions(
  transactions: ImportedTransaction[],
  options?: {
    companyId?: string;
    rules?: CategoryRule[];
    learnedPatterns?: LearnedPattern[];
  },
): {
  categorized: CategorizedTransaction[];
  questions: CategorizationQuestion[];
  profile: CompanyProfile;
} {
  const profile = getCompanyProfile(options?.companyId);
  const rules = [
    ...(profile.rules ?? SHARED_CATEGORY_RULES),
    ...(options?.rules ?? []),
  ];
  const learned = options?.learnedPatterns ?? [];
  const categorized: CategorizedTransaction[] = [];
  const questions: CategorizationQuestion[] = [];

  for (const txn of transactions) {
    const learnedMatch = findLearnedMatch(txn, learned, profile.id);
    if (learnedMatch) {
      categorized.push(
        withCoa(txn, profile, learnedMatch.categoryId, {
          confidence: "high",
          matchedPattern: learnedMatch.normalizedMerchant,
          notes: `Matched learned merchant pattern → ${resolveQboAccountName(profile, learnedMatch.categoryId)}`,
        }),
      );
      continue;
    }

    const ruleMatch = findRuleMatch(txn, rules);
    if (!ruleMatch) {
      const question = buildQuestion(txn, profile, undefined, ["No pattern matched"]);
      questions.push(question);
      categorized.push(
        withCoa(txn, profile, "uncategorized", {
          confidence: "needs_input",
          questionId: question.id,
        }),
      );
      continue;
    }

    const { rule, pattern } = ruleMatch;
    const confidence = confidenceForRule(rule);

    if (confidence === "needs_input" || confidence === "low") {
      const question = buildQuestion(
        txn,
        profile,
        rule.categoryId,
        [
          `Matched “${pattern}” → suggested QBO account ${resolveQboAccountName(profile, rule.categoryId)}`,
        ],
        rule.questionPrompt,
      );
      questions.push(question);
      categorized.push(
        withCoa(txn, profile, rule.categoryId, {
          confidence,
          matchedRuleId: rule.id,
          matchedPattern: pattern,
          questionId: question.id,
        }),
      );
      continue;
    }

    categorized.push(
      withCoa(txn, profile, rule.categoryId, {
        confidence,
        matchedRuleId: rule.id,
        matchedPattern: pattern,
      }),
    );
  }

  return { categorized, questions, profile };
}

export function applyCategoryAnswers(
  categorized: CategorizedTransaction[],
  questions: CategorizationQuestion[],
  answers: CategoryAnswer[],
  learnedPatterns: LearnedPattern[] = [],
  companyId?: string,
): {
  categorized: CategorizedTransaction[];
  questions: CategorizationQuestion[];
  learnedPatterns: LearnedPattern[];
  profile: CompanyProfile;
} {
  const profile = getCompanyProfile(companyId);
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
            pattern.categoryId === answer.categoryId &&
            (pattern.companyId ?? profile.id) === profile.id,
        );
        if (!exists) {
          nextLearned.push({
            id: `learn_${txn.id}`,
            normalizedMerchant: merchant,
            categoryId: answer.categoryId,
            createdFromTransactionId: txn.id,
            answeredAt: new Date().toISOString(),
            companyId: profile.id,
          });
        }
      }
    }

    const qboAccountName = resolveQboAccountName(profile, answer.categoryId);
    return {
      ...txn,
      categoryId: answer.categoryId,
      qboAccountName,
      confidence: "high" as const,
      questionId: undefined,
      notes: answer.note ?? `Confirmed QBO account: ${qboAccountName}`,
    };
  });

  return {
    categorized: nextCategorized,
    questions: remainingQuestions,
    learnedPatterns: nextLearned,
    profile,
  };
}

export function identifyRecurringPatterns(
  transactions: CategorizedTransaction[],
): Array<{ merchant: string; count: number; categoryId: BookkeepingCategoryId; qboAccountName: string }> {
  const counts = new Map<
    string,
    {
      merchant: string;
      count: number;
      categoryId: BookkeepingCategoryId;
      qboAccountName: string;
    }
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
        qboAccountName: txn.qboAccountName,
      });
    }
  }

  return [...counts.values()]
    .filter((entry) => entry.count >= 2)
    .sort((a, b) => b.count - a.count);
}
