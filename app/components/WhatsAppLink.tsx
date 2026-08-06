"use client";

import type { PropertyKey } from "../i18n";
import { buildWhatsAppUrl, getWhatsAppMessage } from "../lib/whatsapp";
import WhatsAppIcon from "./WhatsAppIcon";
import { useLanguage } from "../context/LanguageContext";

type WhatsAppLinkProps = {
  ariaLabel: string;
  className?: string;
  propertyKey?: PropertyKey;
  onClick?: () => void;
  children: React.ReactNode;
};

export default function WhatsAppLink({
  ariaLabel,
  className,
  propertyKey,
  onClick,
  children,
}: WhatsAppLinkProps) {
  const { t } = useLanguage();

  const propertyName = propertyKey
    ? t.properties[propertyKey].name
    : undefined;

  const message = getWhatsAppMessage(
    t.whatsapp.generalMessage,
    t.whatsapp.propertyMessage,
    propertyName,
  );

  return (
    <a
      href={buildWhatsAppUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`inline-flex items-center gap-2 ${className ?? ""}`}
    >
      <WhatsAppIcon className="h-4 w-4 shrink-0" />
      {children}
    </a>
  );
}
