import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_NO_STORE_HEADERS,
  isAllowedAdminOrigin,
} from "../../../lib/admin/auth";
import { readServerEnv } from "../../../lib/server-env";
import {
  AdminAuthConfigError,
  assertOwnerName,
  createOwnerSession,
  getDashboardPassword,
  getOwnerSession,
  getSessionCookieOptions,
  OWNER_SESSION_COOKIE,
  verifyDashboardPassword,
} from "../../../lib/admin/session";

export const dynamic = "force-dynamic";

function readAdminEnvStatus() {
  const password = readServerEnv("OWNER_DASHBOARD_PASSWORD");
  const secret = readServerEnv("OWNER_SESSION_SECRET");

  return {
    dashboardPassword: password.length >= 12,
    sessionSecret: secret.length >= 32,
  };
}

function configErrorResponse(error: AdminAuthConfigError) {
  return NextResponse.json(
    { error: "admin_not_configured", message: error.message },
    { status: 503, headers: ADMIN_NO_STORE_HEADERS },
  );
}

export async function GET() {
  const configured = readAdminEnvStatus();

  try {
    const session = await getOwnerSession();
    return NextResponse.json(
      {
        authenticated: Boolean(session),
        owner: session?.owner ?? null,
        configured,
      },
      { headers: ADMIN_NO_STORE_HEADERS },
    );
  } catch (error) {
    if (error instanceof AdminAuthConfigError) {
      return NextResponse.json(
        {
          authenticated: false,
          owner: null,
          configured,
          error: "admin_not_configured",
          message: error.message,
        },
        { status: 503, headers: ADMIN_NO_STORE_HEADERS },
      );
    }
    return NextResponse.json(
      { error: "session_unavailable", configured },
      { status: 503, headers: ADMIN_NO_STORE_HEADERS },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAllowedAdminOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    let body: { password?: string; owner?: string };
    try {
      body = (await request.json()) as { password?: string; owner?: string };
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const password = body.password?.trim() ?? "";
    const owner = body.owner?.trim() ?? "";

    if (!assertOwnerName(owner)) {
      return NextResponse.json({ error: "invalid_owner" }, { status: 400 });
    }

    if (!verifyDashboardPassword(password)) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "admin login rejected",
          "candidate_length",
          password.length,
          "configured_length",
          getDashboardPassword().length,
        );
      }
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    const response = NextResponse.json(
      { success: true, owner },
      { headers: ADMIN_NO_STORE_HEADERS },
    );

    response.cookies.set(
      OWNER_SESSION_COOKIE,
      createOwnerSession(owner),
      getSessionCookieOptions(process.env.NODE_ENV === "production"),
    );

    return response;
  } catch (error) {
    if (error instanceof AdminAuthConfigError) {
      return configErrorResponse(error);
    }
    console.error("admin session login failed");
    return NextResponse.json(
      { error: "login_failed" },
      { status: 503, headers: ADMIN_NO_STORE_HEADERS },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAllowedAdminOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const response = NextResponse.json(
    { success: true },
    { headers: ADMIN_NO_STORE_HEADERS },
  );

  response.cookies.set(OWNER_SESSION_COOKIE, "", {
    ...getSessionCookieOptions(process.env.NODE_ENV === "production"),
    maxAge: 0,
  });

  return response;
}
