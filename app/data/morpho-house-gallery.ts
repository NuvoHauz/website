import type { PropertyImage } from "./property-gallery-types";

const GALLERY = "/images/properties/morpho-house/gallery";
const HERO = "/images/properties/morpho-house/hero";

export const morphoHouseHero: PropertyImage = {
  src: `${HERO}/morpho-house-bedroom-garden-view-built-in-bed.webp`,
  alt: "Morpho House bedroom with custom wood built-ins and tropical garden view in Paquera, Costa Rica",
  width: 1600,
  height: 1067,
};

/** All eight professional photos in a natural visual sequence (hero image included). */
export const morphoHouseGallery: PropertyImage[] = [
  morphoHouseHero,
  {
    src: `${GALLERY}/morpho-house-studio-kitchen-living-open-plan.webp`,
    alt: "Open-plan studio living area at Morpho House with kitchen, daybed, and garden views",
    width: 2000,
    height: 1333,
  },
  {
    src: `${GALLERY}/morpho-house-kitchen-garden-door-indoor-outdoor.webp`,
    alt: "Morpho House kitchen with blue tile backsplash and open door to a tropical garden deck",
    width: 2000,
    height: 1333,
  },
  {
    src: `${GALLERY}/morpho-house-outdoor-dining-patio-wood-deck.webp`,
    alt: "Covered outdoor dining patio at Morpho House on a wood deck surrounded by tropical gardens",
    width: 2000,
    height: 1334,
  },
  {
    src: `${GALLERY}/morpho-house-bedroom-tv-garden-view.webp`,
    alt: "Morpho House bedroom with garden views, wall-mounted TV, and blue bedding",
    width: 2000,
    height: 1333,
  },
  {
    src: `${GALLERY}/morpho-house-bathroom-chinoiserie-sink-wood-vanity.webp`,
    alt: "Morpho House bathroom with walk-in shower, wood vanity, and blue Chinoiserie vessel sink",
    width: 1684,
    height: 2528,
  },
  {
    src: `${GALLERY}/morpho-house-bedroom-built-in-wood-nook.webp`,
    alt: "Morpho House bedroom with custom wood built-in bed nook, blue bedding, and woven pendant lights",
    width: 2000,
    height: 1333,
  },
  {
    src: `${GALLERY}/morpho-house-kitchen-blue-tile-studio.webp`,
    alt: "Morpho House kitchen and studio living area with blue tile backsplash and polished concrete counters",
    width: 2000,
    height: 1333,
  },
];
