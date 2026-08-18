"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

function isPrivateGuestRoute(url: string): boolean {
  try {
    const pathname = new URL(url).pathname;
    return pathname === "/reservation/status" || pathname.startsWith("/reservation/status/");
  } catch {
    return false;
  }
}

function isAdminRoute(url: string): boolean {
  try {
    const pathname = new URL(url).pathname;
    return pathname === "/admin" || pathname.startsWith("/admin/");
  } catch {
    return false;
  }
}

function sanitizePageViewEvent(event: BeforeSendEvent): BeforeSendEvent {
  try {
    const parsed = new URL(event.url);
    return {
      ...event,
      url: `${parsed.origin}${parsed.pathname}`,
    };
  } catch {
    return event;
  }
}

function analyticsBeforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  if (isAdminRoute(event.url) || isPrivateGuestRoute(event.url)) {
    return null;
  }

  return sanitizePageViewEvent(event);
}

export default function VercelAnalytics() {
  return <Analytics beforeSend={analyticsBeforeSend} />;
}
