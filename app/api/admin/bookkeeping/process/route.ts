import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_NO_STORE_HEADERS,
  isAllowedAdminOrigin,
  requireOwnerSession,
} from "../../../../lib/admin/auth";
import { AdminAuthConfigError } from "../../../../lib/admin/session";
import {
  continueBookkeeperWithAnswers,
  runBookkeeper,
} from "../../../../lib/bookkeeping";
import type {
  AccountSource,
  CategoryAnswer,
  CategorizationQuestion,
  CategorizedTransaction,
  LearnedPattern,
} from "../../../../lib/bookkeeping";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401, headers: ADMIN_NO_STORE_HEADERS },
  );
}

function configError(error: AdminAuthConfigError) {
  return NextResponse.json(
    { error: "admin_not_configured", message: error.message },
    { status: 503, headers: ADMIN_NO_STORE_HEADERS },
  );
}

type ProcessBody = {
  action?: "process" | "answer";
  companyId?: string;
  period?: { start?: string; end?: string };
  imports?: Array<{
    accountId?: string;
    accountName?: string;
    entity?: string;
    currency?: string;
    csvText?: string;
  }>;
  categorized?: CategorizedTransaction[];
  questions?: CategorizationQuestion[];
  answers?: CategoryAnswer[];
  learnedPatterns?: LearnedPattern[];
};

function isIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export async function POST(request: NextRequest) {
  if (!isAllowedAdminOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    await requireOwnerSession();

    let body: ProcessBody;
    try {
      body = (await request.json()) as ProcessBody;
    } catch {
      return NextResponse.json(
        { error: "invalid_json" },
        { status: 400, headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    const periodStart = body.period?.start;
    const periodEnd = body.period?.end;
    if (!isIsoDate(periodStart) || !isIsoDate(periodEnd)) {
      return NextResponse.json(
        { error: "invalid_period" },
        { status: 400, headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    if (periodStart > periodEnd) {
      return NextResponse.json(
        { error: "invalid_period_range" },
        { status: 400, headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    const action = body.action ?? "process";

    if (action === "answer") {
      if (!Array.isArray(body.categorized) || !Array.isArray(body.answers)) {
        return NextResponse.json(
          { error: "missing_answer_payload" },
          { status: 400, headers: ADMIN_NO_STORE_HEADERS },
        );
      }

      const result = continueBookkeeperWithAnswers({
        categorized: body.categorized,
        questions: body.questions ?? [],
        answers: body.answers,
        period: { start: periodStart, end: periodEnd },
        learnedPatterns: body.learnedPatterns ?? [],
        companyId: body.companyId,
      });

      return NextResponse.json(result, { headers: ADMIN_NO_STORE_HEADERS });
    }

    if (!Array.isArray(body.imports) || body.imports.length === 0) {
      return NextResponse.json(
        { error: "missing_imports" },
        { status: 400, headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    const imports = body.imports.map((entry, index) => {
      const accountId = entry.accountId?.trim() || `account_${index + 1}`;
      const accountName = entry.accountName?.trim() || `Account ${index + 1}`;
      const csvText = entry.csvText ?? "";
      if (!csvText.trim()) {
        throw new Error("empty_csv");
      }

      const source: AccountSource = {
        accountId,
        accountName,
        entity: entry.entity?.trim() || undefined,
        currency: entry.currency?.trim() || "USD",
      };

      return { source, csvText };
    });

    const result = runBookkeeper({
      period: { start: periodStart, end: periodEnd },
      companyId: body.companyId,
      imports,
      learnedPatterns: body.learnedPatterns ?? [],
    });

    return NextResponse.json(result, { headers: ADMIN_NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof AdminAuthConfigError) return configError(error);
    if (error instanceof Error && error.message === "unauthenticated") {
      return unauthorized();
    }
    if (error instanceof Error && error.message === "empty_csv") {
      return NextResponse.json(
        { error: "empty_csv" },
        { status: 400, headers: ADMIN_NO_STORE_HEADERS },
      );
    }
    if (
      error instanceof Error &&
      error.message.startsWith("Unrecognized QuickBooks CSV")
    ) {
      return NextResponse.json(
        { error: "unrecognized_csv", message: error.message },
        { status: 400, headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    console.error("bookkeeping process failed", error);
    return NextResponse.json(
      { error: "bookkeeping_failed" },
      { status: 503, headers: ADMIN_NO_STORE_HEADERS },
    );
  }
}
