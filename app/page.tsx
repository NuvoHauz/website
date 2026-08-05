import Image from "next/image";
import Navbar from "./components/Navbar";

const propertyCollections = [
  {
    destination: "Costa Rica",
    properties: [
      {
        name: "Cozy Cabin",
        location: "Paquera, Costa Rica",
        description:
          "A peaceful tropical retreat near Isla Tortuga, Curu Wildlife Refuge, and the famous Bioluminescence Tour. Perfect for couples and small families looking to experience Costa Rica's natural beauty.",
        image: "/images/properties/cozy-cabin.jpg",
      },
      {
        name: "Tropical Cabin",
        location: "Paquera, Costa Rica",
        description:
          "A modern tropical escape surrounded by lush gardens with access to the shared pool. Minutes from Isla Tortuga, Curu Wildlife Refuge, and incredible bioluminescence tours.",
        image: "/images/properties/tropical-cabin.jpg",
      },
      {
        name: "Casa Nuvo",
        location: "Paquera, Costa Rica",
        description:
          "Our signature home featuring spacious accommodations, modern comforts, and easy access to Costa Rica's best beaches, wildlife, and outdoor adventures.",
        image: "/images/properties/casa-nuvo.jpg",
      },
    ],
  },
  {
    destination: "Indianapolis",
    properties: [
      {
        name: "Banksy House",
        location: "Fountain Square, Indianapolis",
        description:
          "A stylish modern home inspired by contemporary art, located minutes from Fountain Square and Downtown Indianapolis.",
        image: "/images/properties/banksy-house.jpg",
      },
      {
        name: "Gallery House",
        location: "Fountain Square, Indianapolis",
        description:
          "A beautifully designed modern home that combines comfort, style, and an excellent location for exploring Indianapolis.",
        image: "/images/properties/gallery-house.jpg",
      },
    ],
  },
];

const aboutBadges = [
  {
    label: "Professionally Managed",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    label: "Thoughtfully Designed",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
  {
    label: "Direct Booking Benefits",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 12h19.5m-19.5 3.75h19.5M3.75 6.75h16.5a1.5 1.5 0 011.5 1.5v10.5a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5z" />
      </svg>
    ),
  },
];

const nicoyaHighlights = [
  {
    title: "Beaches",
    description:
      "Pristine Pacific shores and hidden coves along the Nicoya Peninsula.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    title: "Wildlife",
    description:
      "Scarlet macaws, howler monkeys, and vibrant biodiversity at every turn.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.467.732-3.553" />
      </svg>
    ),
  },
  {
    title: "Fishing",
    description:
      "World-class sport fishing and tranquil coastal waters steps from Paquera.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
      </svg>
    ),
  },
  {
    title: "Local Restaurants",
    description:
      "Fresh seafood, traditional sodas, and hidden gems loved by locals.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
      </svg>
    ),
  },
  {
    title: "Island Adventures",
    description:
      "Ferry to Isla Tortuga, snorkeling, and unforgettable day trips on the water.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    ),
  },
  {
    title: "Sunsets",
    description:
      "Golden-hour views over the Gulf of Nicoya that stop you in your tracks.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
];

const bookingBenefits = [
  {
    title: "Best Available Rate",
    description:
      "Book directly with NuvoHauz and receive our lowest published rate — no platform markups.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Secure Direct Booking",
    description:
      "Transparent pricing and secure payments give you complete peace of mind.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    title: "Personal Communication",
    description:
      "Speak directly with us — from your first inquiry through checkout and beyond.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
  },
  {
    title: "Local Recommendations",
    description:
      "Insider tips on beaches, dining, and adventures from people who know the area.",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
];

const testimonials = [
  {
    quote:
      "Cozy Cabin was everything we hoped for — peaceful, surrounded by nature, and the perfect base for exploring Isla Tortuga and the bioluminescence tour.",
    author: "Sarah & James M.",
    location: "Paquera, Costa Rica",
  },
  {
    quote:
      "Booking direct with NuvoHauz made the whole process effortless. They gave us great local tips and responded to every question personally.",
    author: "Elena Rodriguez",
    location: "Nicoya Peninsula",
  },
  {
    quote:
      "Banksy House was the perfect stay in Fountain Square — stylish, comfortable, and walking distance to everything downtown.",
    author: "David & Priya K.",
    location: "Indianapolis",
  },
];

export default function Home() {
  return (
    <main className="bg-[#F8F6F2] text-[#111111]">
      <Navbar />

      {/* Hero */}
      <section className="relative flex h-screen items-center justify-center overflow-hidden">
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

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <h1 className="animate-fade-in-up font-serif text-5xl font-light leading-[1.1] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
            Stay Different.
            <br />
            <span className="italic">Stay NuvoHauz.</span>
          </h1>
          <p className="animate-fade-in-up-delay-1 mx-auto mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/85 sm:text-xl">
            Discover thoughtfully designed vacation homes in Costa Rica and
            Indianapolis. Every stay is professionally managed, uniquely
            designed, and created to feel like your home away from home.
          </p>
          <div className="animate-fade-in-up-delay-2 mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#stays"
              className="rounded-full bg-white px-10 py-4 text-sm font-medium tracking-wide text-[#111111] transition-all duration-300 hover:bg-white/90 hover:shadow-lg"
            >
              Explore Our Stays
            </a>
            <a
              href="#gallery"
              className="rounded-full border border-white/40 px-10 py-4 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:border-white hover:bg-white/10"
            >
              View Gallery
            </a>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2">
          <div className="animate-scroll-bounce flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">
              Scroll
            </span>
            <div className="h-10 w-px bg-gradient-to-b from-white/60 to-transparent" />
          </div>
        </div>
      </section>

      {/* Our Collection */}
      <section id="stays" className="px-6 py-24 md:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center md:mb-20">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#C69C6D]">
              Our Collection
            </p>
            <h2 className="font-serif text-4xl font-light tracking-tight md:text-5xl lg:text-6xl">
              Curated Stays, Unforgettable Destinations
            </h2>
          </div>

          <div className="space-y-20 md:space-y-28">
            {propertyCollections.map((collection) => (
              <div key={collection.destination}>
                <h3 className="mb-10 font-serif text-3xl font-light tracking-tight text-[#111111] md:text-4xl">
                  {collection.destination}
                </h3>
                <div
                  className={`grid gap-8 ${
                    collection.properties.length === 2
                      ? "md:grid-cols-2"
                      : "md:grid-cols-2 lg:grid-cols-3"
                  }`}
                >
                  {collection.properties.map((property) => (
                    <article
                      key={property.name}
                      className="group relative h-[520px] cursor-pointer overflow-hidden rounded-2xl shadow-md transition-shadow duration-500 hover:shadow-2xl"
                    >
                      <div className="absolute inset-0 overflow-hidden">
                        <Image
                          src={property.image}
                          alt={property.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/20" />
                      <div className="relative flex h-full flex-col justify-end p-8 text-white">
                        <h4 className="font-serif text-3xl font-light tracking-tight">
                          {property.name}
                        </h4>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/70">
                          {property.location}
                        </p>
                        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85">
                          {property.description}
                        </p>
                        <span className="mt-6 inline-flex items-center text-sm font-medium tracking-wide text-[#C69C6D] transition-colors duration-300 group-hover:text-white">
                          View Property &rarr;
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discover the Nicoya Peninsula */}
      <section id="discover" className="bg-white px-6 py-24 md:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center md:mb-20">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#C69C6D]">
              Costa Rica
            </p>
            <h2 className="font-serif text-4xl font-light tracking-tight md:text-5xl lg:text-6xl">
              Discover the Nicoya Peninsula
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#111111]/60">
              From our home base in Paquera, the Nicoya Peninsula offers
              world-class beaches, rich wildlife, and authentic coastal living
              — all within reach of your stay.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {nicoyaHighlights.map((highlight) => (
              <div
                key={highlight.title}
                className="group rounded-2xl border border-[#111111]/5 bg-[#F8F6F2] p-8 transition-all duration-500 hover:border-[#C69C6D]/30 hover:shadow-lg"
              >
                <div className="mb-5 text-[#C69C6D] transition-colors duration-300 group-hover:text-[#111111]">
                  {highlight.icon}
                </div>
                <h3 className="mb-2 font-serif text-xl font-medium">
                  {highlight.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#111111]/60">
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Book Direct */}
      <section className="px-6 py-24 md:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center md:mb-20">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#C69C6D]">
              Why Book Direct
            </p>
            <h2 className="font-serif text-4xl font-light tracking-tight md:text-5xl">
              The NuvoHauz Difference
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {bookingBenefits.map((benefit) => (
              <div
                key={benefit.title}
                className="group rounded-2xl bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-6 text-[#C69C6D] transition-colors duration-300 group-hover:text-[#111111]">
                  {benefit.icon}
                </div>
                <h3 className="mb-3 font-serif text-xl font-medium">
                  {benefit.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#111111]/60">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lifestyle */}
      <section id="gallery" className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a2520] via-[#3d3530] to-[#1a1815]" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-4xl font-light leading-snug tracking-tight text-white md:text-5xl lg:text-6xl">
            More than a vacation.
            <br />
            <span className="italic text-[#C69C6D]">
              A place you&apos;ll never forget.
            </span>
          </h2>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-24 md:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center md:mb-20">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#C69C6D]">
              Guest Testimonials
            </p>
            <h2 className="font-serif text-4xl font-light tracking-tight md:text-5xl">
              Stories from Our Guests
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <blockquote
                key={testimonial.author}
                className="flex flex-col rounded-2xl bg-white p-8 shadow-sm transition-all duration-500 hover:shadow-lg md:p-10"
              >
                <div className="mb-6 text-[#C69C6D]">
                  <svg className="h-8 w-8 opacity-40" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.016 3.016 0 01-2.2 2.903c-.135.042-.277.062-.418.062-1.675 0-2.652-1.082-2.652-2.334zm9.166 0C12.553 16.227 12 15 12 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.016 3.016 0 01-2.2 2.903c-.135.042-.277.062-.418.062-1.675 0-2.652-1.082-2.652-2.334z" />
                  </svg>
                </div>
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

      {/* About */}
      <section id="about" className="bg-white px-6 py-24 md:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="relative order-1 aspect-[4/5] overflow-hidden rounded-2xl shadow-lg lg:order-2">
              <Image
                src="/images/sunsetgrl.jpg"
                alt="Guest enjoying a sunset on the beach in Costa Rica"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            <div className="order-2 lg:order-1">
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#C69C6D]">
                About
              </p>
              <h2 className="font-serif text-4xl font-light tracking-tight md:text-5xl">
                About NuvoHauz
              </h2>
              <div className="mt-8 space-y-6 text-base leading-relaxed text-[#111111]/70">
                <p>
                  NuvoHauz was created from a passion for travel, thoughtful
                  design, and unforgettable guest experiences.
                </p>
                <p>
                  What began with a single vacation home has grown into a
                  carefully curated collection of properties in Costa Rica and
                  Indianapolis. Every home is personally selected, professionally
                  managed, and designed to feel warm, modern, and welcoming.
                </p>
                <p>
                  Whether you&apos;re relaxing beside the tropical beaches of
                  Costa Rica or exploring the vibrant neighborhoods of
                  Indianapolis, our goal is simple:
                </p>
                <p className="font-serif text-lg font-light italic text-[#111111]">
                  Help every guest feel at home while creating memories that
                  last long after checkout.
                </p>
                <p>
                  We believe every stay should be comfortable, beautifully
                  designed, and effortlessly memorable.
                </p>
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                {aboutBadges.map((badge) => (
                  <div
                    key={badge.label}
                    className="inline-flex items-center gap-3 rounded-full border border-[#111111]/10 bg-[#F8F6F2] px-5 py-3"
                  >
                    <span className="text-[#C69C6D]">{badge.icon}</span>
                    <span className="text-sm font-medium tracking-wide">
                      {badge.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="contact" className="px-6 py-24 md:py-32 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-3xl bg-[#111111] px-8 py-20 text-center md:px-16 md:py-24">
          <h2 className="font-serif text-4xl font-light tracking-tight text-white md:text-5xl lg:text-6xl">
            Ready for your next escape?
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base font-light leading-relaxed text-white/60">
            Whether you&apos;re headed to the Nicoya Peninsula or staying in
            Indianapolis, book directly with NuvoHauz for the best experience.
          </p>
          <a
            href="#contact"
            className="mt-10 inline-block rounded-full bg-[#C69C6D] px-12 py-4 text-sm font-medium tracking-wide text-white transition-all duration-300 hover:bg-[#b58a5c] hover:shadow-lg"
          >
            Book Your Stay
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#111111]/5 px-6 py-12 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-xs tracking-[0.35em] text-[#111111]/80">NUVOHAUZ</p>
          <p className="text-xs text-[#111111]/40">
            &copy; {new Date().getFullYear()} NuvoHauz. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
