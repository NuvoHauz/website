export interface RiuHouseImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export type RiuHouseGallerySectionKey = "mainBedroomBathroom";

export interface RiuHouseGallerySection {
  labelKey?: RiuHouseGallerySectionKey;
  images: RiuHouseImage[];
}

const GALLERY = "/images/properties/riu-house/gallery";

/** Lead and collection card image */
export const riuHouseHero: RiuHouseImage = {
  src: "/images/properties/riu-house/hero/pool.jpg",
  alt: "Shared swimming pool surrounded by tropical gardens at Riu House in Paquera, Costa Rica",
  width: 5828,
  height: 3890,
};

/**
 * Gallery sections ordered: exterior, pool, living, kitchen, dining, main bedroom
 * suite, other bedrooms and bathrooms, terraces, outdoor shower.
 */
export const riuHouseGallerySections: RiuHouseGallerySection[] = [
  {
    images: [
  {
    src: `${GALLERY}/main-house-exterior.jpg`,
    alt: "Exterior of Riu House with tropical landscaping in Paquera, Costa Rica",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/front.jpg`,
    alt: "Front facade of Riu House with modern tropical architecture",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/front2.jpg`,
    alt: "Front view of Riu House showing glass doors and covered entry",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/frontview.jpg`,
    alt: "Riu House exterior viewed through lush tropical foliage",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/mainentrance.jpg`,
    alt: "Main entrance and walkway leading to Riu House",
    width: 5723,
    height: 3820,
  },
  {
    src: `${GALLERY}/frontwalkway.jpg`,
    alt: "Stone walkway and front approach to Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/walkway.jpg`,
    alt: "Garden walkway with tropical plants at Riu House",
    width: 3917,
    height: 5868,
  },
  {
    src: `${GALLERY}/frontpool.jpg`,
    alt: "Shared swimming pool in front of Riu House with tropical surroundings",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/poolview.jpg`,
    alt: "Pool deck view across the shared swimming pool at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/pool2.jpg`,
    alt: "Shared pool area with lounge space beside Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/pool3.jpg`,
    alt: "Swimming pool and tropical gardens at Riu House",
    width: 5924,
    height: 3955,
  },
  {
    src: `${GALLERY}/pool4.jpg`,
    alt: "Poolside view with palm trees at Riu House",
    width: 3963,
    height: 5936,
  },
  {
    src: `${GALLERY}/pool5.jpg`,
    alt: "Shared pool and outdoor living space at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/pool6.jpg`,
    alt: "Pool area and covered terrace at Riu House",
    width: 5772,
    height: 3853,
  },
  {
    src: `${GALLERY}/lvnarea.jpg`,
    alt: "Open-concept living area with natural light at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/lvnarea2.jpg`,
    alt: "Living room seating and glass doors opening to the terrace at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/spaces.jpg`,
    alt: "Indoor-outdoor living space at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/spaces2.jpg`,
    alt: "Living area flow between interior and terrace at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/spaces3.jpg`,
    alt: "Comfortable living space with tropical views at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/spaces4.jpg`,
    alt: "Living room detail with warm finishes at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/kitchen.jpg`,
    alt: "Fully equipped kitchen with large island at Riu House",
    width: 5960,
    height: 3979,
  },
  {
    src: `${GALLERY}/kitchen2.jpg`,
    alt: "Kitchen island with seating at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/kitchen3.jpg`,
    alt: "Modern kitchen cabinetry and appliances at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/kitchen4.jpg`,
    alt: "Kitchen prep area and counter space at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/main-house-dining.jpg`,
    alt: "Indoor dining area at Riu House",
    width: 5868,
    height: 3917,
  },
    ],
  },
  {
    labelKey: "mainBedroomBathroom",
    images: [
  {
    src: `${GALLERY}/MainBed.jpg`,
    alt: "Primary queen bedroom suite at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/mainbed2.jpg`,
    alt: "Queen bedroom with built-in storage at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/mainbed3.jpg`,
    alt: "Bedroom suite with terrace access at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/mainbed4.jpg`,
    alt: "Private bedroom with warm custom finishes at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/mainbath.jpg`,
    alt: "Main bedroom private bathroom with double vanity",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/mainbath2.jpg`,
    alt: "Main bedroom private bathroom shower and vanity",
    width: 4016,
    height: 6016,
  },
  {
    src: `${GALLERY}/mainbath3.jpg`,
    alt: "Main bedroom private bathroom double vanity and pendant lights",
    width: 4016,
    height: 6016,
  },
    ],
  },
  {
    images: [
  {
    src: `${GALLERY}/frntbed.jpg`,
    alt: "Front queen bedroom suite at Riu House",
    width: 3739,
    height: 5601,
  },
  {
    src: `${GALLERY}/frntbed2.jpg`,
    alt: "Front bedroom with en-suite access at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/frntbed3.jpg`,
    alt: "Bedroom with air conditioning and television at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/frntbed4.jpg`,
    alt: "Queen bedroom with balcony doors at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/backbed.jpg`,
    alt: "Rear queen bedroom suite at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/frontbedbath.jpg`,
    alt: "En-suite bathroom with vanity in a front bedroom at Riu House",
    width: 4016,
    height: 6016,
  },
  {
    src: `${GALLERY}/frontbedbath2.jpg`,
    alt: "Bedroom en-suite bathroom detail at Riu House",
    width: 4016,
    height: 6016,
  },
  {
    src: `${GALLERY}/dwnbath.jpg`,
    alt: "Downstairs bathroom with vanity at Riu House",
    width: 4016,
    height: 6016,
  },
  {
    src: `${GALLERY}/dwnbath2.jpg`,
    alt: "Bathroom shower and vanity at Riu House",
    width: 4016,
    height: 6016,
  },
  {
    src: `${GALLERY}/dwnbath3.jpg`,
    alt: "Guest bathroom with modern fixtures at Riu House",
    width: 3799,
    height: 5691,
  },
  {
    src: `${GALLERY}/pinkbath.jpg`,
    alt: "Bedroom en-suite bathroom with vanity area at Riu House",
    width: 4016,
    height: 6016,
  },
  {
    src: `${GALLERY}/pinkbath2.jpg`,
    alt: "En-suite bathroom detail at Riu House",
    width: 3941,
    height: 5912,
  },
  {
    src: `${GALLERY}/frnttopdeck.jpg`,
    alt: "Front upper covered terrace at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/frnttopdeck2.jpg`,
    alt: "Upper balcony with tropical views at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/backdeck.jpg`,
    alt: "Rear covered deck and outdoor seating at Riu House",
    width: 5971,
    height: 3986,
  },
  {
    src: `${GALLERY}/backpatio.jpg`,
    alt: "Back patio with access to tropical gardens at Riu House",
    width: 5883,
    height: 3927,
  },
  {
    src: `${GALLERY}/backpatio2.jpg`,
    alt: "Covered rear patio at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/backporchtop.jpg`,
    alt: "Upper rear porch overlooking the gardens at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/backporchtop2.jpg`,
    alt: "Rear upper terrace with lush surroundings at Riu House",
    width: 6016,
    height: 4016,
  },
  {
    src: `${GALLERY}/outdoorshower.jpg`,
    alt: "Outdoor shower surrounded by tropical greenery at Riu House",
    width: 5922,
    height: 3953,
  },
    ],
  },
];

export const riuHouseGallery: RiuHouseImage[] = riuHouseGallerySections.flatMap(
  (section) => section.images,
);

export const RIU_HOUSE_PATH = "/properties/riu-house";
