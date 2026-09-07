"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PropertyKey } from "../i18n";
import { useLanguage } from "../context/LanguageContext";
import type { PropertyImage } from "../data/property-gallery-types";
import { getCabinPageTranslations } from "../i18n/cabin-pages";
import Navbar from "./Navbar";

export type CabinPropertyPageProps = {
  propertyKey: Extract<PropertyKey, "cabin1" | "cabin2">;
  shortLabel: string;
  hero: PropertyImage;
  gallery: PropertyImage[];
  airbnbUrl: string;
};

export default function CabinPropertyPage({
  propertyKey,
  shortLabel,
  hero,
  gallery,
  airbnbUrl,
}: CabinPropertyPageProps) {
  const { locale, t } = useLanguage();
  const pt = useMemo(() => getCabinPageTranslations(locale), [locale]);
  const copy = t.properties[propertyKey];
  const exploreHeading =
    propertyKey === "cabin1"
      ? pt.exploreMorphoHouse
      : pt.exploreCasitaGreenIguana;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxImage =
    lightboxIndex !== null ? gallery[lightboxIndex] ?? null : null;

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const openLightbox = useCallback(
    (image: PropertyImage) => {
      const index = gallery.findIndex((item) => item.src === image.src);
      setLightboxIndex(index >= 0 ? index : 0);
    },
    [gallery],
  );

  const showPreviousImage = useCallback(() => {
    setLightboxIndex((current) => {
      if (current === null || gallery.length === 0) return null;
      return (current - 1 + gallery.length) % gallery.length;
    });
  }, [gallery.length]);

  const showNextImage = useCallback(() => {
    setLightboxIndex((current) => {
      if (current === null || gallery.length === 0) return null;
      return (current + 1) % gallery.length;
    });
  }, [gallery.length]);

  const navLinks = [
    { label: t.nav.stays, href: "/#stays" },
    { label: t.nav.discover, href: "/#discover" },
    { label: t.nav.gallery, href: "/#gallery" },
    { label: t.nav.about, href: "/#about" },
    { label: t.nav.contactUs, href: "/#contact", whatsapp: true as const },
  ];

  useEffect(() => {
    document.title = `${copy.name} | NuvoHauz`;
  }, [copy.name]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousImage();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextImage();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxIndex, closeLightbox, showPreviousImage, showNextImage]);

  return (
    <main className="w-full overflow-x-hidden bg-[#F8F6F2] text-[#111111]">
      <Navbar navLinks={navLinks} logoHref="/" />

      <section className="relative flex min-h-[55vh] items-end overflow-hidden sm:min-h-[65vh] md:min-h-[70vh]">
        <div className="absolute inset-0">
          <Image
            src={hero.src}
            alt={hero.alt}
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
            &larr; {pt.backToCollection}
          </Link>
          <p className="text-xs uppercase tracking-[0.3em] text-[#C69C6D]">
            {shortLabel}
          </p>
          <h1 className="mt-3 max-w-4xl font-serif text-[2rem] font-light leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            {copy.name}
          </h1>
          <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-white/85 sm:text-lg md:text-xl">
            {copy.description}
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/70 sm:text-xs">
            {copy.location}
          </p>
        </div>
      </section>

      {gallery.length > 0 && (
        <section
          aria-label={pt.photoGalleryLabel}
          className="px-4 py-10 sm:px-6 sm:py-14 lg:px-10"
        >
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-6 font-serif text-xl font-light tracking-tight text-[#111111] sm:text-2xl md:text-3xl">
              {exploreHeading}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {gallery.map((image) => (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => openLightbox(image)}
                  aria-label={`Enlarge photo: ${image.alt}`}
                  className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-md transition-shadow duration-300 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C69C6D]"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="h-full w-full object-cover object-center"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {lightboxImage && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImage.alt}
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Close enlarged photo"
            className="absolute right-4 top-4 z-10 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white transition-colors hover:bg-white/20 sm:right-8 sm:top-8"
          >
            &times;
          </button>

          {gallery.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPreviousImage();
                }}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 z-10 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl leading-none text-white transition-colors hover:bg-white/20 sm:left-6"
              >
                &#8249;
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNextImage();
                }}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 z-10 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-3xl leading-none text-white transition-colors hover:bg-white/20 sm:right-6"
              >
                &#8250;
              </button>
            </>
          ) : null}

          <div
            className="relative max-h-[90vh] max-w-[min(90vw,1200px)]"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => {
              const touch = event.touches[0];
              if (!touch) return;
              event.currentTarget.dataset.touchStartX = String(touch.clientX);
            }}
            onTouchEnd={(event) => {
              const startX = Number(event.currentTarget.dataset.touchStartX);
              const touch = event.changedTouches[0];
              if (!touch || Number.isNaN(startX)) return;

              const deltaX = touch.clientX - startX;
              if (Math.abs(deltaX) < 48) return;

              if (deltaX > 0) {
                showPreviousImage();
              } else {
                showNextImage();
              }
            }}
          >
            <Image
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              width={lightboxImage.width}
              height={lightboxImage.height}
              sizes="90vw"
              className="h-auto max-h-[85vh] w-auto max-w-full object-contain"
            />
            <p className="mt-3 text-center text-sm text-white/70">
              {lightboxIndex + 1} / {gallery.length}
            </p>
          </div>
        </div>
      )}

      <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-base leading-relaxed text-[#111111]/70">
            {copy.description}
          </p>
          <a
            href={airbnbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-[#C69C6D] px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:bg-[#b58a5c] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C69C6D] sm:w-auto"
          >
            {pt.checkAvailabilityOnAirbnb}
          </a>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-3xl bg-[#111111] px-5 py-14 text-center sm:px-8 sm:py-20 md:px-16">
          <h2 className="font-serif text-3xl font-light tracking-tight text-white sm:text-4xl">
            {copy.name}
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base font-light leading-relaxed text-white/60">
            {copy.description}
          </p>
          <a
            href={airbnbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#C69C6D] px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:bg-[#b58a5c] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C69C6D] sm:px-12 sm:py-4"
          >
            {pt.checkAvailabilityOnAirbnb}
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
