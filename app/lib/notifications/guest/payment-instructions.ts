import { escapeHtml } from "../email-text";

export type ApprovedPaymentInstructionsContent = {
  text: string;
  html: string;
};

export function getApprovedPaymentInstructionsContent(): ApprovedPaymentInstructionsContent | null {
  const raw = process.env.BOOKING_APPROVED_PAYMENT_INSTRUCTIONS?.trim();
  if (!raw) return null;

  const text = raw;
  const html = `<div style="margin:16px 0;padding:16px;background:#FCFAF7;border-radius:12px;color:#333;line-height:1.6;white-space:pre-wrap;">${escapeHtml(raw)}</div>`;

  return { text, html };
}
