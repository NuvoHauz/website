export function maskGuestEmail(email: string): string {
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf("@");
  if (atIndex <= 0) return "***";
  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  if (!domain) return "***";
  const visible = local.slice(0, Math.min(1, local.length));
  return `${visible}***@${domain}`;
}
