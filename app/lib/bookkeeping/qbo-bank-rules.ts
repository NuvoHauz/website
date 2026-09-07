import { normalizeMerchant } from "./categorize";
import { getCompanyProfile, resolveQboAccountName } from "./default-rules";
import type {
  BookkeepingCategoryId,
  CategorizedTransaction,
  CategoryRule,
  CompanyProfile,
  LearnedPattern,
  QboBankRuleSuggestion,
} from "./types";

export type { QboBankRuleSuggestion };

function moneyMovementFromSign(
  amountSign: CategoryRule["amountSign"],
): QboBankRuleSuggestion["moneyMovement"] {
  if (amountSign === "positive") return "money_in";
  if (amountSign === "negative") return "money_out";
  return "either";
}

function moneyMovementFromAmount(
  amountCents: number,
): QboBankRuleSuggestion["moneyMovement"] {
  if (amountCents > 0) return "money_in";
  if (amountCents < 0) return "money_out";
  return "either";
}

/**
 * Builds QBO Bank Rule suggestions so QuickBooks itself auto-classifies
 * pending/future bank-feed transactions (Intuit does not expose For Review via API).
 */
export function buildQboBankRuleSuggestions(params: {
  companyId?: string;
  categorized?: CategorizedTransaction[];
  learnedPatterns?: LearnedPattern[];
  defaultRules?: CategoryRule[];
  /** Minimum supporting transactions before suggesting a rule from live data. */
  minSupport?: number;
}): QboBankRuleSuggestion[] {
  const profile = getCompanyProfile(params.companyId);
  const minSupport = params.minSupport ?? 2;
  const byKey = new Map<string, QboBankRuleSuggestion>();

  function upsert(suggestion: QboBankRuleSuggestion) {
    const key = `${suggestion.contains}|${suggestion.qboAccountName}|${suggestion.moneyMovement}`;
    const existing = byKey.get(key);
    if (!existing || suggestion.supportCount > existing.supportCount) {
      byKey.set(key, suggestion);
    } else if (existing) {
      existing.supportCount = Math.max(
        existing.supportCount,
        suggestion.supportCount,
      );
    }
  }

  for (const pattern of params.learnedPatterns ?? []) {
    if (pattern.companyId && pattern.companyId !== profile.id) continue;
    const contains = pattern.normalizedMerchant.trim();
    if (contains.length < 3) continue;
    upsert({
      id: `learn_${contains}`,
      contains,
      conditionField: "Bank text",
      qboAccountName: resolveQboAccountName(profile, pattern.categoryId),
      categoryId: pattern.categoryId,
      moneyMovement: "either",
      supportCount: 1,
      source: "learned_pattern",
      ruleName: `${profile.name}: ${contains} → ${resolveQboAccountName(profile, pattern.categoryId)}`,
    });
  }

  const highConfidence = (params.categorized ?? []).filter(
    (txn) =>
      txn.confidence === "high" &&
      txn.categoryId !== "uncategorized" &&
      txn.categoryId !== "transfer" &&
      txn.categoryId !== "personal",
  );

  const groups = new Map<
    string,
    {
      contains: string;
      categoryId: BookkeepingCategoryId;
      moneyMovement: QboBankRuleSuggestion["moneyMovement"];
      count: number;
    }
  >();

  for (const txn of highConfidence) {
    const contains = normalizeMerchant(txn.description);
    if (contains.length < 3) continue;
    const moneyMovement = moneyMovementFromAmount(txn.amountCents);
    const key = `${contains}|${txn.categoryId}|${moneyMovement}`;
    const existing = groups.get(key);
    if (existing) existing.count += 1;
    else {
      groups.set(key, {
        contains,
        categoryId: txn.categoryId,
        moneyMovement,
        count: 1,
      });
    }
  }

  for (const group of groups.values()) {
    if (group.count < minSupport) continue;
    upsert({
      id: `high_${group.contains}_${group.categoryId}`,
      contains: group.contains,
      conditionField: "Bank text",
      qboAccountName: resolveQboAccountName(profile, group.categoryId),
      categoryId: group.categoryId,
      moneyMovement: group.moneyMovement,
      supportCount: group.count,
      source: "high_confidence",
      ruleName: `${profile.name}: ${group.contains} → ${resolveQboAccountName(profile, group.categoryId)}`,
    });
  }

  for (const rule of params.defaultRules ?? profile.rules ?? []) {
    if (rule.questionPrompt) continue;
    if (rule.priority < 80) continue;
    for (const pattern of rule.patterns) {
      const contains = pattern.trim().toLowerCase();
      if (contains.length < 3) continue;
      upsert({
        id: `default_${rule.id}_${contains}`,
        contains,
        conditionField: "Bank text",
        qboAccountName: resolveQboAccountName(profile, rule.categoryId),
        categoryId: rule.categoryId,
        moneyMovement: moneyMovementFromSign(rule.amountSign),
        supportCount: 0,
        source: "default_rule",
        ruleName: `${profile.name}: ${contains} → ${resolveQboAccountName(profile, rule.categoryId)}`,
      });
    }
  }

  return [...byKey.values()].sort((a, b) => {
    if (b.supportCount !== a.supportCount) return b.supportCount - a.supportCount;
    return a.ruleName.localeCompare(b.ruleName);
  });
}

export function qboBankRulesToCsv(rules: QboBankRuleSuggestion[]): string {
  const header = [
    "Rule name",
    "Apply when bank text contains",
    "Money movement",
    "Assign QBO account",
    "Support count",
    "Source",
  ];
  const lines = rules.map((rule) =>
    [
      rule.ruleName,
      rule.contains,
      rule.moneyMovement,
      rule.qboAccountName,
      String(rule.supportCount),
      rule.source,
    ]
      .map(csvEscape)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export function qboBankRulesSetupMarkdown(
  profile: CompanyProfile,
  rules: QboBankRuleSuggestion[],
): string {
  const steps = rules
    .slice(0, 40)
    .map(
      (rule, index) =>
        `${index + 1}. **${rule.ruleName}**
   - Condition: Bank text / Description contains \`${rule.contains}\`
   - Money: ${rule.moneyMovement.replace("_", " ")}
   - Category: **${rule.qboAccountName}**
   - In QBO: check **Also apply to transactions waiting for review** (clears existing pending that match)`,
    )
    .join("\n\n");

  return `# Automate classification in QuickBooks Online — ${profile.name}

Intuit does **not** allow apps to categorize Banking → For review / pending via API.
The supported way to automate those pending counts is **Bank Rules** inside QBO.

## One-time setup (then QBO classifies for you)

1. Open **Alfa Renovations** in QuickBooks Online (web).
2. Go to **Bookkeeping → Rules** (or Banking → Rules).
3. Create each rule below (or start with the highest support-count ones).
4. For every rule, enable **Also apply to transactions waiting for review** so current pending (Forum, Amex, etc.) get categorized automatically when they match.
5. Turn on **Auto-add** only for rules you fully trust.

After rules exist, new bank-feed transactions matching them are classified by QuickBooks — you are not categorizing one-by-one.

## Suggested rules

${steps || "_No rules generated yet — run the bookkeeper on an export first._"}

## Notes

- Rules automate **matching merchants**. Odd one-off spend still needs a human glance.
- Keep Renovations rules out of the Rental House account (or use account-specific rules in QBO).
- Re-run the bookkeeper monthly to discover new merchants → new rules.
`;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
