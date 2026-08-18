/** NuvoHauz business rule: approved payment holds last one hour. */
export const APPROVAL_HOLD_MS = 60 * 60 * 1000;

export function computeApprovalHoldExpiresAt(approvedAt: Date): Date {
  return new Date(approvedAt.getTime() + APPROVAL_HOLD_MS);
}
