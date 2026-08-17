import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_NO_STORE_HEADERS,
  isAllowedAdminOrigin,
  requireOwnerSession,
} from "../../../lib/admin/auth";
import {
  createHolidayPeriod,
  createNightlyOverride,
  deleteHolidayPeriod,
  deleteNightlyOverride,
  fetchAdminPricing,
  updateHolidayPeriod,
  updateNightlyOverride,
  updatePricingSettings,
} from "../../../lib/admin/pricing-service";
import { AdminAuthConfigError } from "../../../lib/admin/session";
import { parseDollarsToCents } from "../../../lib/pricing/engine";
import {
  isPositiveRateCents,
  isValidExtraGuestFeeCents,
  isValidGuestCountRange,
  isValidIncludedGuestCount,
  isValidMaximumGuestCount,
} from "../../../lib/pricing/settings-validation";
import { PROPERTY_MAX_CAPACITY } from "../../../lib/pricing/types";
import { isValidUuid } from "../../../lib/admin/validation";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

export async function GET() {
  try {
    await requireOwnerSession();
    const data = await fetchAdminPricing();
    return NextResponse.json(
      {
        ...data,
        minimumStayRules: data.minimumStayRules.map((rule) => ({
          ...rule,
          label: WEEKDAY_LABELS[rule.checkInDayOfWeek] ?? String(rule.checkInDayOfWeek),
        })),
      },
      { headers: ADMIN_NO_STORE_HEADERS },
    );
  } catch (error) {
    if (error instanceof AdminAuthConfigError) return configError(error);
    if (error instanceof Error && error.message === "unauthenticated") {
      return unauthorized();
    }
    return NextResponse.json(
      { error: "pricing_unavailable" },
      { status: 503, headers: ADMIN_NO_STORE_HEADERS },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isAllowedAdminOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    await requireOwnerSession();
    const body = (await request.json()) as {
      monTueWedRate?: string;
      thursdayRate?: string;
      friSatRate?: string;
      sundayRate?: string;
      cleaningFee?: string;
      includedGuestCount?: number | string;
      extraGuestFee?: string;
      maximumGuestCount?: number | string;
      active?: boolean;
    };

    const cleaningFeeCents = parseDollarsToCents(body.cleaningFee ?? "");
    const monTueWedRateCents = parseDollarsToCents(body.monTueWedRate ?? "");
    const thursdayRateCents = parseDollarsToCents(body.thursdayRate ?? "");
    const friSatRateCents = parseDollarsToCents(body.friSatRate ?? "");
    const sundayRateCents = parseDollarsToCents(body.sundayRate ?? "");
    const includedGuestCount = Number(body.includedGuestCount ?? 6);
    const extraGuestFeeCents = parseDollarsToCents(body.extraGuestFee ?? "25");
    const maximumGuestCount = Number(body.maximumGuestCount ?? 8);

    if (
      !isValidIncludedGuestCount(includedGuestCount) ||
      extraGuestFeeCents == null ||
      !isValidExtraGuestFeeCents(extraGuestFeeCents) ||
      !isValidMaximumGuestCount(maximumGuestCount) ||
      !isValidGuestCountRange(includedGuestCount, maximumGuestCount)
    ) {
      return NextResponse.json(
        { error: "validation_failed" },
        { status: 400, headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    if (Boolean(body.active)) {
      if (
        !isPositiveRateCents(monTueWedRateCents) ||
        !isPositiveRateCents(thursdayRateCents) ||
        !isPositiveRateCents(friSatRateCents) ||
        !isPositiveRateCents(sundayRateCents) ||
        cleaningFeeCents == null ||
        cleaningFeeCents < 0 ||
        maximumGuestCount > PROPERTY_MAX_CAPACITY
      ) {
        return NextResponse.json(
          { error: "incomplete_rates" },
          { status: 400, headers: ADMIN_NO_STORE_HEADERS },
        );
      }
    }

    const result = await updatePricingSettings({
      monTueWedRateCents,
      thursdayRateCents,
      friSatRateCents,
      sundayRateCents,
      cleaningFeeCents: cleaningFeeCents ?? 8000,
      includedGuestCount,
      extraGuestFeeCents,
      maximumGuestCount,
      currency: "USD",
      active: Boolean(body.active),
    });

    if (result === "incomplete_rates") {
      return NextResponse.json(
        { error: "incomplete_rates" },
        { status: 400, headers: ADMIN_NO_STORE_HEADERS },
      );
    }
    if (result === "invalid_currency") {
      return NextResponse.json(
        { error: "invalid_currency" },
        { status: 400, headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    if (result === "error") {
      return NextResponse.json(
        { error: "update_failed" },
        { status: 503, headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    return NextResponse.json({ success: true }, { headers: ADMIN_NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof AdminAuthConfigError) return configError(error);
    if (error instanceof Error && error.message === "unauthenticated") {
      return unauthorized();
    }
    return NextResponse.json(
      { error: "update_failed" },
      { status: 503, headers: ADMIN_NO_STORE_HEADERS },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAllowedAdminOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    await requireOwnerSession();
    const body = (await request.json()) as {
      kind?: "holiday" | "override";
      name?: string;
      startDate?: string;
      endDate?: string;
      adjustmentType?: "fixed_rate" | "percentage";
      adjustmentValue?: number | string;
      minimumNights?: number;
      priority?: number;
      active?: boolean;
      overrideDate?: string;
      nightlyRate?: string;
      internalReason?: string | null;
    };

    if (body.kind === "holiday") {
      const adjustmentValue =
        body.adjustmentType === "fixed_rate"
          ? parseDollarsToCents(String(body.adjustmentValue ?? ""))
          : Number(body.adjustmentValue);

      if (
        !body.name?.trim() ||
        !body.startDate ||
        !body.endDate ||
        !body.adjustmentType ||
        adjustmentValue == null ||
        Number.isNaN(adjustmentValue)
      ) {
        return NextResponse.json({ error: "validation_failed" }, { status: 400 });
      }

      if (
        body.adjustmentType === "percentage" &&
        (adjustmentValue < 0 || adjustmentValue > 500)
      ) {
        return NextResponse.json({ error: "validation_failed" }, { status: 400 });
      }

      const result = await createHolidayPeriod({
        name: body.name.trim(),
        startDate: body.startDate,
        endDate: body.endDate,
        adjustmentType: body.adjustmentType,
        adjustmentValue,
        minimumNights: Math.max(1, Number(body.minimumNights ?? 1)),
        priority: Number(body.priority ?? 0),
        active: body.active ?? true,
      });

      if (result === "overlap") {
        return NextResponse.json(
          { error: "holiday_overlap" },
          { status: 409, headers: ADMIN_NO_STORE_HEADERS },
        );
      }
      if (result === "invalid_adjustment") {
        return NextResponse.json({ error: "validation_failed" }, { status: 400 });
      }
      if (result === "error") {
        return NextResponse.json(
          { error: "create_failed" },
          { status: 503, headers: ADMIN_NO_STORE_HEADERS },
        );
      }

      return NextResponse.json({ success: true }, { headers: ADMIN_NO_STORE_HEADERS });
    }

    if (body.kind === "override") {
      const nightlyRateCents = parseDollarsToCents(body.nightlyRate ?? "");
      if (!body.overrideDate || nightlyRateCents == null) {
        return NextResponse.json({ error: "validation_failed" }, { status: 400 });
      }

      const result = await createNightlyOverride({
        overrideDate: body.overrideDate,
        nightlyRateCents,
        minimumNights:
          body.minimumNights == null ? null : Math.max(1, Number(body.minimumNights)),
        internalReason: body.internalReason?.trim() || null,
        active: body.active ?? true,
      });

      if (result === "error") {
        return NextResponse.json(
          { error: "create_failed" },
          { status: 503, headers: ADMIN_NO_STORE_HEADERS },
        );
      }

      return NextResponse.json({ success: true }, { headers: ADMIN_NO_STORE_HEADERS });
    }

    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  } catch (error) {
    if (error instanceof AdminAuthConfigError) return configError(error);
    if (error instanceof Error && error.message === "unauthenticated") {
      return unauthorized();
    }
    return NextResponse.json(
      { error: "create_failed" },
      { status: 503, headers: ADMIN_NO_STORE_HEADERS },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAllowedAdminOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    await requireOwnerSession();
    const body = (await request.json()) as {
      kind?: "holiday" | "override";
      id?: string;
      active?: boolean;
      name?: string;
      startDate?: string;
      endDate?: string;
      adjustmentType?: "fixed_rate" | "percentage";
      adjustmentValue?: number | string;
      minimumNights?: number;
      priority?: number;
      overrideDate?: string;
      nightlyRate?: string;
      internalReason?: string | null;
    };

    const id = body.id?.trim() ?? "";
    if (!isValidUuid(id) || !body.kind) {
      return NextResponse.json({ error: "validation_failed" }, { status: 400 });
    }

    if (body.kind === "holiday") {
      const adjustmentValue =
        body.adjustmentType === "fixed_rate" && body.adjustmentValue != null
          ? parseDollarsToCents(String(body.adjustmentValue))
          : body.adjustmentValue != null
            ? Number(body.adjustmentValue)
            : undefined;

      const result = await updateHolidayPeriod(id, {
        ...(body.name != null ? { name: body.name.trim() } : {}),
        ...(body.startDate != null ? { startDate: body.startDate } : {}),
        ...(body.endDate != null ? { endDate: body.endDate } : {}),
        ...(body.adjustmentType != null ? { adjustmentType: body.adjustmentType } : {}),
        ...(adjustmentValue != null ? { adjustmentValue } : {}),
        ...(body.minimumNights != null
          ? { minimumNights: Math.max(1, Number(body.minimumNights)) }
          : {}),
        ...(body.priority != null ? { priority: Number(body.priority) } : {}),
        ...(body.active != null ? { active: body.active } : {}),
      });

      if (result === "overlap") {
        return NextResponse.json(
          { error: "holiday_overlap" },
          { status: 409, headers: ADMIN_NO_STORE_HEADERS },
        );
      }
      if (result === "not_found") {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      if (result === "invalid_adjustment") {
        return NextResponse.json({ error: "validation_failed" }, { status: 400 });
      }
      if (result === "error") {
        return NextResponse.json(
          { error: "update_failed" },
          { status: 503, headers: ADMIN_NO_STORE_HEADERS },
        );
      }

      return NextResponse.json({ success: true }, { headers: ADMIN_NO_STORE_HEADERS });
    }

    const nightlyRateCents =
      body.nightlyRate != null ? parseDollarsToCents(body.nightlyRate) : undefined;

    const result = await updateNightlyOverride(id, {
      ...(body.overrideDate != null ? { overrideDate: body.overrideDate } : {}),
      ...(nightlyRateCents != null ? { nightlyRateCents } : {}),
      ...(body.minimumNights !== undefined
        ? {
            minimumNights:
              body.minimumNights == null
                ? null
                : Math.max(1, Number(body.minimumNights)),
          }
        : {}),
      ...(body.internalReason !== undefined
        ? { internalReason: body.internalReason?.trim() || null }
        : {}),
      ...(body.active != null ? { active: body.active } : {}),
    });

    if (result === "not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (result === "error") {
      return NextResponse.json(
        { error: "update_failed" },
        { status: 503, headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    return NextResponse.json({ success: true }, { headers: ADMIN_NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof AdminAuthConfigError) return configError(error);
    if (error instanceof Error && error.message === "unauthenticated") {
      return unauthorized();
    }
    return NextResponse.json(
      { error: "update_failed" },
      { status: 503, headers: ADMIN_NO_STORE_HEADERS },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAllowedAdminOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    await requireOwnerSession();
    const body = (await request.json()) as { kind?: "holiday" | "override"; id?: string };
    const id = body.id?.trim() ?? "";

    if (!isValidUuid(id) || !body.kind) {
      return NextResponse.json({ error: "validation_failed" }, { status: 400 });
    }

    const result =
      body.kind === "holiday"
        ? await deleteHolidayPeriod(id)
        : await deleteNightlyOverride(id);

    if (result === "error") {
      return NextResponse.json(
        { error: "delete_failed" },
        { status: 503, headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    return NextResponse.json({ success: true }, { headers: ADMIN_NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof AdminAuthConfigError) return configError(error);
    if (error instanceof Error && error.message === "unauthenticated") {
      return unauthorized();
    }
    return NextResponse.json(
      { error: "delete_failed" },
      { status: 503, headers: ADMIN_NO_STORE_HEADERS },
    );
  }
}
