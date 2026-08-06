export interface RiuHouseGalleryImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface RiuHouseTranslations {
  fullName: string;
  tagline: string;
  location: string;
  metaDescription: string;
  stats: {
    bedrooms: string;
    bathrooms: string;
    sleepsComfortably: string;
    maxGuests: string;
    introRate: string;
  };
  sections: {
    about: string;
    amenities: string;
    sleeping: string;
    pricing: string;
    houseRules: string;
    arrival: string;
  };
  description: string;
  amenities: string[];
  sleeping: string[];
  pricing: string[];
  houseRules: string[];
  arrival: string;
  inquireButton: string;
  whatsappMessage: string;
  whatsappAriaLabel: string;
  gallerySections: {
    mainBedroomBathroom: string;
  };
  backToCollection: string;
}
