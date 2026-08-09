"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import LanguageSelector from "./LanguageSelector";
import WhatsAppLink from "./WhatsAppLink";

export type NavLink = {
  label: string;
  href: string;
  whatsapp?: boolean;
};

type NavbarProps = {
  navLinks: NavLink[];
  logoHref?: string;
};

export default function Navbar({ navLinks, logoHref = "#" }: NavbarProps) {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 w-full max-w-full overflow-x-hidden transition-all duration-500 ${
        scrolled
          ? "border-b border-white/[0.08] bg-black/25 shadow-sm backdrop-blur-2xl backdrop-saturate-150"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex w-full max-w-7xl min-w-0 items-center justify-between gap-1.5 px-3 py-3.5 sm:gap-2 sm:px-4 sm:py-4 lg:gap-3 lg:px-10 lg:py-5">
        <a
          href={logoHref}
          className="shrink-0 text-[10px] font-medium tracking-[0.16em] text-white transition-colors duration-300 max-[359px]:tracking-[0.12em] sm:text-xs sm:tracking-[0.25em] lg:text-sm lg:tracking-[0.35em]"
        >
          NUVOHAUZ
        </a>

        <ul className="hidden items-center gap-8 lg:flex xl:gap-10">
          {navLinks.map((link) =>
            link.whatsapp ? (
              <li key={link.label}>
                <WhatsAppLink
                  ariaLabel={t.whatsapp.ariaContactUs}
                  className="inline-flex min-h-[44px] items-center gap-2 text-sm tracking-wide text-white/80 transition-colors duration-300 hover:text-white"
                >
                  {link.label}
                </WhatsAppLink>
              </li>
            ) : (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="inline-flex min-h-[44px] items-center text-sm tracking-wide text-white/80 transition-colors duration-300 hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ),
          )}
        </ul>

        <div className="flex min-w-0 shrink items-center gap-1 sm:gap-1.5 lg:gap-3">
          <LanguageSelector variant="desktop" />
          <LanguageSelector variant="mobile-header" />

          <WhatsAppLink
            ariaLabel={t.whatsapp.ariaBookDirect}
            className="inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-full bg-[#111111] py-2 pl-2.5 pr-3 text-xs font-medium text-white transition-all duration-300 hover:bg-[#333333] max-[374px]:px-2.5 sm:gap-1.5 sm:pl-3 sm:pr-3.5 sm:text-sm md:gap-2 md:px-4 lg:hidden"
          >
            <span className="hidden min-[375px]:inline">{t.nav.bookDirect}</span>
          </WhatsAppLink>

          <WhatsAppLink
            ariaLabel={t.whatsapp.ariaBookDirect}
            className="hidden min-h-[44px] items-center gap-2 whitespace-nowrap rounded-full bg-[#111111] px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-[#333333] lg:inline-flex lg:px-6"
          >
            {t.nav.bookDirect}
          </WhatsAppLink>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 flex-col items-center justify-center gap-1.5 lg:hidden"
          >
            <span
              className={`block h-0.5 w-6 bg-white transition-transform duration-300 ${
                menuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-white transition-opacity duration-300 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-white transition-transform duration-300 ${
                menuOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 top-[64px] bg-[#111111]/95 backdrop-blur-lg transition-all duration-500 sm:top-[72px] lg:hidden ${
          menuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <ul className="flex flex-col items-center gap-6 px-4 pt-10 sm:gap-8 sm:pt-16">
          {navLinks.map((link) => (
            <li key={link.label}>
              {link.whatsapp ? (
                <WhatsAppLink
                  ariaLabel={t.whatsapp.ariaContactUs}
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-[44px] items-center gap-2 text-lg tracking-wide text-white/90 transition-colors hover:text-white"
                >
                  {link.label}
                </WhatsAppLink>
              ) : (
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-[44px] items-center text-lg tracking-wide text-white/90 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              )}
            </li>
          ))}
          <li>
            <LanguageSelector
              variant="mobile"
              onSelect={() => setMenuOpen(false)}
            />
          </li>
          <li>
            <WhatsAppLink
              ariaLabel={t.whatsapp.ariaBookDirect}
              onClick={() => setMenuOpen(false)}
              className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-medium text-[#111111]"
            >
              {t.nav.bookDirect}
            </WhatsAppLink>
          </li>
        </ul>
      </div>
    </header>
  );
}
