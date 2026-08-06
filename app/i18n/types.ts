export const LOCALES = ["en", "es", "fr", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export type PropertyKey =
  | "riuHouse"
  | "cabin1"
  | "cabin2"
  | "banksyHouse"
  | "carriageHouse";

export interface PropertyTranslation {
  name: string;
  location: string;
  description: string;
}

export interface Translations {
  nav: {
    stays: string;
    discover: string;
    gallery: string;
    about: string;
    contactUs: string;
    bookDirect: string;
  };
  hero: {
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    exploreStays: string;
    viewGallery: string;
    scroll: string;
  };
  collection: {
    label: string;
    heading: string;
  };
  destinations: {
    costaRica: string;
    indianapolis: string;
  };
  properties: Record<PropertyKey, PropertyTranslation>;
  buttons: {
    comingSoon: string;
    nowAvailable: string;
    viewOnAirbnb: string;
    viewProperty: string;
    exploreRiuHouse: string;
    bookYourStay: string;
  };
  discover: {
    label: string;
    heading: string;
    intro: string;
    highlights: {
      beaches: { title: string; description: string };
      wildlife: { title: string; description: string };
      fishing: { title: string; description: string };
      restaurants: { title: string; description: string };
      adventures: { title: string; description: string };
      sunsets: { title: string; description: string };
    };
  };
  bookDirect: {
    label: string;
    heading: string;
    benefits: {
      bestRate: { title: string; description: string };
      secure: { title: string; description: string };
      personal: { title: string; description: string };
      local: { title: string; description: string };
    };
  };
  gallery: {
    line1: string;
    line2: string;
  };
  testimonials: {
    label: string;
    heading: string;
    items: {
      quote: string;
      author: string;
      location: string;
    }[];
  };
  about: {
    label: string;
    heading: string;
    p1: string;
    p2: string;
    p3: string;
    p4: string;
    p5: string;
    badges: {
      managed: string;
      designed: string;
      direct: string;
    };
    imageAlt: string;
  };
  cta: {
    heading: string;
    body: string;
  };
  footer: {
    rights: string;
  };
  whatsapp: {
    generalMessage: string;
    propertyMessage: string;
    ariaBookDirect: string;
    ariaBookStay: string;
    ariaContactUs: string;
  };
  language: {
    selectorLabel: string;
  };
}
