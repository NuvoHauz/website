export type RpcFailureKind =
  | "conflict"
  | "invalid"
  | "not_found"
  | "block_type_constraint"
  | "block_status_constraint"
  | "booking_status_constraint"
  | "server";

type RpcErrorShape = {
  code?: string | number;
  message?: string;
  details?: string;
  hint?: string;
};

function errorHaystack(error: RpcErrorShape): string {
  return `${error.message ?? ""} ${error.details ?? ""}`;
}

function errorCode(error: RpcErrorShape): string {
  return String(error.code ?? "");
}

export function mapRpcError(error: RpcErrorShape): RpcFailureKind {
  const code = errorCode(error);
  const haystack = errorHaystack(error);

  if (code === "23505" || haystack.includes("dates_unavailable")) {
    return "conflict";
  }

  if (code === "23514") {
    if (haystack.includes("availability_valid_block_type")) {
      return "block_type_constraint";
    }
    if (haystack.includes("availability_valid_status")) {
      return "block_status_constraint";
    }
    if (haystack.includes("booking_valid_status")) {
      return "booking_status_constraint";
    }
  }

  if (
    code === "P0001" ||
    haystack.includes("invalid_status_transition") ||
    haystack.includes("invalid_date_range") ||
    haystack.includes("invalid_block_type") ||
    haystack.includes("block_linked_to_request")
  ) {
    return "invalid";
  }

  if (code === "P0002" || haystack.includes("_not_found")) {
    return "not_found";
  }

  return "server";
}

export function logRpcFailure(
  rpcName: string,
  context: string,
  error: RpcErrorShape,
): void {
  console.error(
    `${rpcName} failed`,
    context,
    errorCode(error) || "unknown",
    error.message ?? "unknown",
    error.details ?? "",
    error.hint ?? "",
  );
}

export function reservationPatchErrorMessage(payload: {
  error?: string;
  code?: string;
}): string {
  switch (payload.error) {
    case "block_type_constraint":
      return "This update could not be saved: the database does not allow approval-hold blocks yet (block_type_constraint).";
    case "block_status_constraint":
      return "This update could not be saved: the database does not allow deactivating calendar blocks yet (block_status_constraint).";
    case "booking_status_constraint":
      return "This update could not be saved: the database does not allow this reservation status yet (booking_status_constraint).";
    case "dates_unavailable":
      return "Those dates are no longer available.";
    case "invalid_transition":
      return "This request cannot be updated in its current state.";
    case "not_found":
      return "This request was not found.";
    case "update_failed":
      if (payload.code === "23514") {
        return "This update could not be saved: a database check constraint blocked it (code 23514). Apply the owner-dashboard migrations.";
      }
      return payload.code
        ? `Unable to update this request (update_failed, code ${payload.code}).`
        : "Unable to update this request.";
    default:
      return payload.code
        ? `Unable to update this request (${payload.error ?? "unknown_error"}, code ${payload.code}).`
        : "Unable to update this request.";
  }
}
