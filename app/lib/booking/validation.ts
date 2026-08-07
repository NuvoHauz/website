export const MAX_TOTAL_GUESTS = 8;
export const MIN_ADULT_AGE = 13;
export const MAX_CHILD_AGE = 12;

export type ChildAgeParseResult =
  | { ok: true; ages: number[] }
  | { ok: false; errorKey: keyof ChildAgeErrorKeys };

export interface ChildAgeErrorKeys {
  required: string;
  countMismatch: string;
  invalidFormat: string;
  emptyValue: string;
  nonNumeric: string;
  decimal: string;
  outOfRange: string;
  mustBeAdult: string;
}

export function validateGuestCounts(
  adults: number,
  children: number,
): "ok" | "noAdults" | "tooManyGuests" {
  if (adults < 1) return "noAdults";
  if (adults + children > MAX_TOTAL_GUESTS) return "tooManyGuests";
  if (adults < 0 || children < 0) return "noAdults";
  return "ok";
}

export function parseChildAges(input: string, expectedCount: number): ChildAgeParseResult {
  if (expectedCount === 0) {
    return input.trim() === "" ? { ok: true, ages: [] } : { ok: false, errorKey: "countMismatch" };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, errorKey: "required" };
  }

  const parts = trimmed.split(",");
  if (parts.some((part) => part.trim() === "")) {
    return { ok: false, errorKey: "emptyValue" };
  }

  const ages: number[] = [];
  for (const part of parts) {
    const token = part.trim();
    if (!/^\d+$/.test(token)) {
      if (token.includes(".")) {
        return { ok: false, errorKey: "decimal" };
      }
      return { ok: false, errorKey: "nonNumeric" };
    }

    const age = Number(token);
    if (age >= MIN_ADULT_AGE) {
      return { ok: false, errorKey: "mustBeAdult" };
    }
    if (age < 0 || age > MAX_CHILD_AGE) {
      return { ok: false, errorKey: "outOfRange" };
    }
    ages.push(age);
  }

  if (ages.length !== expectedCount) {
    return { ok: false, errorKey: "countMismatch" };
  }

  return { ok: true, ages };
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function generatePrototypeReference(): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RH-${suffix}`;
}
