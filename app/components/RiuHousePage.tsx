"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import { riuHouseGallery } from "../data/riu-house-gallery";
import { getRiuHouseTranslations } from "../i18n/riu-house";
import { buildWhatsAppUrl } from "../lib/whatsapp";
import Navbar from "./Navbar";
import WhatsAppIcon from "./WhatsAppIcon";

function SectionHeading({ label }: { label: string }) {
  return (
    <h2 className="font-serif text-2xl font-light tracking-tight text-[#111111] sm:text-3xl md:text-4xl">
      {label}
    </h2>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 text-sm leading-relaxed text-[#111111]/70 sm:text-base"
        >
          <span
            aria-hidden
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C69C6D]"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function RiuHousePage() {
  const { locale, t } = useLanguage();
  const rt = useMemo(() => getRiuHouseTranslations(locale), [locale]);

  const leadImage = riuHouseGallery[0];
  const galleryImages = riuHouseGallery.slice(1);

  const navLinks = [
    { label: t.nav.stays, href: "/#stays" },
    { label: t.nav.discover, href: "/#discover" },
    { label: t.nav.gallery, href: "/#gallery" },
    { label: t.nav.about, href: "/#about" },
    { label: t.nav.contactUs, href: "/#contact", whatsapp: true as const },
  ];

  const statItems = [
    rt.stats.bedrooms,
    rt.stats.bathrooms,
    rt.stats.sleepsComfortably,
    rt.stats.maxGuests,
    rt.stats.introRate,
  ];

  useEffect(() => {
    document.title = `${rt.fullName} | NuvoHauz`;
  }, [rt.fullName]);

  const whatsappHref = buildWhatsAppUrl(rt.whatsappMessage);

  return (
    <main className="w-full overflow-x-hidden bg-[#F8F6F2] text-[#111111]">
      <Navbar navLinks={navLinks} logoHref="/" />

      <section className="relative flex min-h-[55vh] items-end overflow-hidden sm:min-h-[65vh] md:min-h-[70vh]">
        <div className="absolute inset-0">
          <Image
            src={leadImage.src}
            alt={rt.galleryAlts[leadImage.altKey]}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 pt-28 sm:px-6 sm:pb-14 sm:pt-32 md:pb-16 lg:px-10">
          <Link
            href="/#stays"
            className="mb-6 inline-flex min-h-[44px] items-center text-xs uppercase tracking-[0.25em] text-white/70 transition-colors hover:text-white"
          >
            &larr; {rt.backToCollection}
          </Link>
          <p className="text-xs uppercase tracking-[0.3em] text-[#C69C6D]">
            Riu House
          </p>
          <h1 className="mt-3 max-w-4xl font-serif text-[2rem] font-light leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            {rt.fullName}
          </h1>
          <p className="mt-4 max-w-2xl text-base font-light italic text-white/85 sm:text-lg md:text-xl">
            {rt.tagline}
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/70 sm:text-xs">
            {rt.location}
          </p>
        </div>
      </section>

      {galleryImages.length > 0 && (
        <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {galleryImages.map((image) => (
              <div
                key={image.src}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md"
              >
                <Image
                  src={image.src}
                  alt={rt.galleryAlts[image.altKey]}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap gap-3">
            {statItems.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#111111]/10 bg-white px-4 py-2 text-xs tracking-wide text-[#111111]/80 sm:text-sm"
              >
                {item}
              </span>
            ))}
          </div>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={rt.whatsappAriaLabel}
            className="mt-8 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#C69C6D] px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:bg-[#b58a5c] hover:shadow-lg sm:mt-10 sm:w-auto"
          >
            <WhatsAppIcon className="h-4 w-4 shrink-0" />
            {rt.inquireButton}
          </a>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <SectionHeading label={rt.sections.about} />
          <div className="mt-8 space-y-6 text-base leading-relaxed text-[#111111]/70">
            {rt.description.split("\n\n").map((paragraph: string) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <SectionHeading label={rt.sections.amenities} />
          <BulletList items={rt.amenities} />
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <SectionHeading label={rt.sections.sleeping} />
          <BulletList items={rt.sleeping} />
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <SectionHeading label={rt.sections.pricing} />
          <BulletList items={rt.pricing} />
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <SectionHeading label={rt.sections.houseRules} />
          <BulletList items={rt.houseRules} />
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <SectionHeading label={rt.sections.arrival} />
          <p className="mt-8 text-base leading-relaxed text-[#111111]/70">
            {rt.arrival}
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-3xl bg-[#111111] px-5 py-14 text-center sm:px-8 sm:py-20 md:px-16">
          <h2 className="font-serif text-3xl font-light tracking-tight text-white sm:text-4xl">
            {rt.inquireButton}
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base font-light leading-relaxed text-white/60">
            {rt.tagline}
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={rt.whatsappAriaLabel}
            className="mt-10 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#C69C6D] px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:bg-[#b58a5c] hover:shadow-lg sm:px-12 sm:py-4"
          >
            <WhatsAppIcon className="h-4 w-4 shrink-0" />
            {rt.inquireButton}
          </a>
        </div>
      </section>

      <footer className="border-t border-[#111111]/5 px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:gap-6 sm:text-left">
          <Link
            href="/"
            className="text-xs tracking-[0.35em] text-[#111111]/80 transition-colors hover:text-[#111111]"
          >
            NUVOHAUZ
          </Link>
          <p className="text-xs text-[#111111]/40">
            &copy; {new Date().getFullYear()} NuvoHauz. {t.footer.rights}
          </p>
        </div>
      </footer>
    </main>
  );
}
