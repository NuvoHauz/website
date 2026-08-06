"use client";

import Image from "next/image";
import { useLanguage } from "../context/LanguageContext";
import { propertyCollections } from "../data/properties";
import Navbar from "./Navbar";
import WhatsAppLink from "./WhatsAppLink";
import {
  badgeIcons,
  benefitIcons,
  highlightIcons,
  quoteIcon,
} from "./SectionIcons";

export default function HomePage() {
  const { t } = useLanguage();

  const navLinks = [
    { label: t.nav.stays, href: "#stays" },
    { label: t.nav.discover, href: "#discover" },
    { label: t.nav.gallery, href: "#gallery" },
    { label: t.nav.about, href: "#about" },
    { label: t.nav.contactUs, href: "#contact", whatsapp: true as const },
  ];

  const highlightKeys = [
    "beaches",
    "wildlife",
    "fishing",
    "restaurants",
    "adventures",
    "sunsets",
  ] as const;

  const benefitKeys = ["bestRate", "secure", "personal", "local"] as const;

  const badgeKeys = ["managed", "designed", "direct"] as const;

  return (
    <main className="w-full overflow-x-hidden bg-[#F8F6F2] text-[#111111]">
      <Navbar navLinks={navLinks} />

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero/hero1.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="animate-ken-burns object-cover object-center will-change-transform"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/45 to-black/55" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6">
          <h1 className="animate-fade-in-up font-serif text-[2.125rem] font-light leading-[1.1] tracking-tight text-white min-[375px]:text-4xl sm:text-6xl md:text-7xl lg:text-8xl">
            {t.hero.titleLine1}
            <br />
            <span className="italic">{t.hero.titleLine2}</span>
          </h1>
          <p className="animate-fade-in-up-delay-1 mx-auto mt-6 max-w-2xl text-base font-light leading-relaxed text-white/85 sm:mt-8 sm:text-lg md:text-xl">
            {t.hero.subtitle}
          </p>
          <div className="animate-fade-in-up-delay-2 mt-10 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:mt-12 sm:max-w-none sm:flex-row sm:items-center sm:gap-4">
            <a
              href="#stays"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-medium tracking-wide text-[#111111] transition-all duration-300 hover:bg-white/90 hover:shadow-lg sm:px-10 sm:py-4"
            >
              {t.hero.exploreStays}
            </a>
            <a
              href="#gallery"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/40 px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:border-white hover:bg-white/10 sm:px-10 sm:py-4"
            >
              {t.hero.viewGallery}
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 sm:bottom-10 sm:block">
          <div className="animate-scroll-bounce flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">
              {t.hero.scroll}
            </span>
            <div className="h-10 w-px bg-gradient-to-b from-white/60 to-transparent" />
          </div>
        </div>
      </section>

      <section id="stays" className="box-border w-full max-w-full overflow-hidden py-16 sm:py-24 md:py-32">
        <div className="mx-auto box-border w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-10">
          <div className="mb-12 text-center md:mb-20">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#C69C6D]">
              {t.collection.label}
            </p>
            <h2 className="mx-auto max-w-full px-1 font-serif text-[1.75rem] font-light tracking-tight text-balance break-words sm:text-4xl md:text-5xl lg:text-6xl">
              {t.collection.heading}
            </h2>
          </div>

          <div className="space-y-16 sm:space-y-20 md:space-y-28">
            {propertyCollections.map((collection) => (
              <div key={collection.destinationKey} className="min-w-0">
                <h3 className="mb-8 font-serif text-2xl font-light tracking-tight text-[#111111] sm:mb-10 sm:text-3xl md:text-4xl">
                  {t.destinations[collection.destinationKey]}
                </h3>
                <div className="grid w-full min-w-0 grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {collection.properties.map((property) => {
                    const copy = t.properties[property.key];
                    return (
                      <article
                        key={property.key}
                        className="group relative box-border min-h-[420px] w-full min-w-0 overflow-hidden rounded-2xl shadow-md transition-shadow duration-500 hover:shadow-2xl sm:h-[520px]"
                      >
                        <div className="absolute inset-0 overflow-hidden">
                          <Image
                            src={property.image}
                            alt={copy.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/20" />
                        <div className="relative flex h-full min-h-[420px] flex-col justify-end p-5 text-white sm:min-h-0 sm:p-6 md:p-8">
                          <h4 className="font-serif text-xl font-light tracking-tight sm:text-2xl md:text-3xl">
                            {copy.name}
                          </h4>
                          <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/70 sm:text-xs">
                            {copy.location}
                          </p>
                          <p className="mt-3 max-w-full text-sm leading-relaxed text-white/85 sm:mt-4">
                            {copy.description}
                          </p>
                          {property.comingSoon ? (
                            <span className="mt-5 inline-flex min-h-[44px] w-fit items-center rounded-full border border-white/30 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-white/80 sm:mt-6">
                              {t.buttons.comingSoon}
                            </span>
                          ) : (
                            <a
                              href={property.airbnbUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-5 inline-flex min-h-[44px] w-fit items-center text-sm font-medium tracking-wide text-[#C69C6D] transition-colors duration-300 hover:text-white sm:mt-6"
                            >
                              {t.buttons.viewOnAirbnb} &rarr;
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="discover" className="bg-white px-4 py-16 sm:px-6 sm:py-24 md:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center md:mb-20">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#C69C6D]">
              {t.discover.label}
            </p>
            <h2 className="font-serif text-3xl font-light tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              {t.discover.heading}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#111111]/60">
              {t.discover.intro}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {highlightKeys.map((key) => (
              <div
                key={key}
                className="group rounded-2xl border border-[#111111]/5 bg-[#F8F6F2] p-6 sm:p-8 transition-all duration-500 hover:border-[#C69C6D]/30 hover:shadow-lg"
              >
                <div className="mb-5 text-[#C69C6D] transition-colors duration-300 group-hover:text-[#111111]">
                  {highlightIcons[key]}
                </div>
                <h3 className="mb-2 font-serif text-xl font-medium">
                  {t.discover.highlights[key].title}
                </h3>
                <p className="text-sm leading-relaxed text-[#111111]/60">
                  {t.discover.highlights[key].description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 md:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center md:mb-20">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#C69C6D]">
              {t.bookDirect.label}
            </p>
            <h2 className="font-serif text-3xl font-light tracking-tight sm:text-4xl md:text-5xl">
              {t.bookDirect.heading}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
            {benefitKeys.map((key) => (
              <div
                key={key}
                className="group rounded-2xl bg-white p-6 sm:p-8 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-6 text-[#C69C6D] transition-colors duration-300 group-hover:text-[#111111]">
                  {benefitIcons[key]}
                </div>
                <h3 className="mb-3 font-serif text-xl font-medium">
                  {t.bookDirect.benefits[key].title}
                </h3>
                <p className="text-sm leading-relaxed text-[#111111]/60">
                  {t.bookDirect.benefits[key].description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="gallery" className="relative flex min-h-[60vh] items-center justify-center overflow-hidden sm:min-h-[70vh]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a2520] via-[#3d3530] to-[#1a1815]" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-serif text-3xl font-light leading-snug tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            {t.gallery.line1}
            <br />
            <span className="italic text-[#C69C6D]">{t.gallery.line2}</span>
          </h2>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 md:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center md:mb-20">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#C69C6D]">
              {t.testimonials.label}
            </p>
            <h2 className="font-serif text-3xl font-light tracking-tight sm:text-4xl md:text-5xl">
              {t.testimonials.heading}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            {t.testimonials.items.map((testimonial) => (
              <blockquote
                key={testimonial.author}
                className="flex flex-col rounded-2xl bg-white p-6 shadow-sm transition-all duration-500 hover:shadow-lg sm:p-8 md:p-10"
              >
                <div className="mb-6 text-[#C69C6D]">{quoteIcon}</div>
                <p className="flex-1 font-serif text-lg font-light leading-relaxed italic text-[#111111]/80">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <footer className="mt-8 border-t border-[#111111]/5 pt-6">
                  <p className="text-sm font-medium">{testimonial.author}</p>
                  <p className="mt-1 text-xs tracking-wide text-[#111111]/50">
                    {testimonial.location}
                  </p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-white px-4 py-16 sm:px-6 sm:py-24 md:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <div className="relative order-1 aspect-[4/5] overflow-hidden rounded-2xl shadow-lg lg:order-2">
              <Image
                src="/images/sunsetgrl.jpg"
                alt={t.about.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            <div className="order-2 lg:order-1">
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#C69C6D]">
                {t.about.label}
              </p>
              <h2 className="font-serif text-3xl font-light tracking-tight sm:text-4xl md:text-5xl">
                {t.about.heading}
              </h2>
              <div className="mt-8 space-y-6 text-base leading-relaxed text-[#111111]/70">
                <p>{t.about.p1}</p>
                <p>{t.about.p2}</p>
                <p>{t.about.p3}</p>
                <p className="font-serif text-lg font-light italic text-[#111111]">
                  {t.about.p4}
                </p>
                <p>{t.about.p5}</p>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {badgeKeys.map((key) => (
                  <div
                    key={key}
                    className="inline-flex min-h-[44px] items-center gap-3 rounded-full border border-[#111111]/10 bg-[#F8F6F2] px-5 py-3"
                  >
                    <span className="text-[#C69C6D]">{badgeIcons[key]}</span>
                    <span className="text-sm font-medium tracking-wide">
                      {t.about.badges[key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="px-4 py-16 sm:px-6 sm:py-24 md:py-32 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-3xl bg-[#111111] px-5 py-14 text-center sm:px-8 sm:py-20 md:px-16 md:py-24">
          <h2 className="font-serif text-3xl font-light tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            {t.cta.heading}
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base font-light leading-relaxed text-white/60">
            {t.cta.body}
          </p>
          <WhatsAppLink
            ariaLabel={t.whatsapp.ariaBookStay}
            className="mt-10 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#C69C6D] px-8 py-3.5 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:bg-[#b58a5c] hover:shadow-lg sm:px-12 sm:py-4"
          >
            {t.buttons.bookYourStay}
          </WhatsAppLink>
        </div>
      </section>

      <footer className="border-t border-[#111111]/5 px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:gap-6 sm:text-left">
          <p className="text-xs tracking-[0.35em] text-[#111111]/80">NUVOHAUZ</p>
          <p className="text-xs text-[#111111]/40">
            &copy; {new Date().getFullYear()} NuvoHauz. {t.footer.rights}
          </p>
        </div>
      </footer>
    </main>
  );
}
