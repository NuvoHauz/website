import type { PropertyImage } from "./property-gallery-types";

const GALLERY = "/images/properties/casita-green-iguana/gallery";
const HERO = "/images/properties/casita-green-iguana/hero";

export const casitaGreenIguanaHero: PropertyImage = {
  src: `${HERO}/casita-green-iguana-terrace-entrance-unit-2-evening.webp`,
  alt: "Casita Green Iguana covered terrace at dusk with warm lighting and tropical gardens in Paquera, Costa Rica",
  width: 1600,
  height: 1066,
};

/** All eight professional photos in a natural visual sequence (hero image included). */
export const casitaGreenIguanaGallery: PropertyImage[] = [
  casitaGreenIguanaHero,
  {
    src: `${GALLERY}/casita-green-iguana-open-plan-living-kitchen-dining.webp`,
    alt: "Open-plan kitchen and dining area at Casita Green Iguana with teal hex tile and glass dining table",
    width: 2000,
    height: 1333,
  },
  {
    src: `${GALLERY}/casita-green-iguana-bedroom-macrame-boho-decor.webp`,
    alt: "Casita Green Iguana bedroom with woven pendant lamps, macramé wall art, and tan bedding",
    width: 2000,
    height: 1333,
  },
  {
    src: `${GALLERY}/casita-green-iguana-bathroom-green-tile-yellow-sink.webp`,
    alt: "Casita Green Iguana bathroom with green tile shower, yellow vessel sink, and floral wallpaper",
    width: 2000,
    height: 3000,
  },
  {
    src: `${GALLERY}/casita-green-iguana-living-room-patio-door-garden.webp`,
    alt: "Casita Green Iguana living room with sliding door open to a wood deck and tropical garden",
    width: 2000,
    height: 1332,
  },
  {
    src: `${GALLERY}/casita-green-iguana-kitchen-hex-tile-dining-table.webp`,
    alt: "Casita Green Iguana kitchen and dining area with teal hex tile backsplash and molded dining chairs",
    width: 2000,
    height: 1333,
  },
  {
    src: `${GALLERY}/casita-green-iguana-living-room-peacock-art-sofa.webp`,
    alt: "Casita Green Iguana living room with gold peacock art, geometric rug, and comfortable seating",
    width: 2000,
    height: 1333,
  },
  {
    src: `${GALLERY}/casita-green-iguana-bedroom-woven-lamps-netflix.webp`,
    alt: "Casita Green Iguana bedroom with woven globe pendant lamps, tan bedding, and wall-mounted TV",
    width: 2000,
    height: 1333,
  },
];
