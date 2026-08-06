export interface RiuHouseImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export type RiuHouseGallerySectionKey =
  | "frontEntrance"
  | "poolOutdoor"
  | "livingArea"
  | "kitchenDining"
  | "mainBedroomBathroom"
  | "backBedroomBathroom"
  | "frontBedroomBathroom";

export interface RiuHouseGallerySection {
  labelKey: RiuHouseGallerySectionKey;
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

/** Guided property tour gallery sections */
export const riuHouseGallerySections: RiuHouseGallerySection[] = [
  {
    labelKey: "frontEntrance",
    images: [
      {
        src: `${GALLERY}/main-house-exterior.jpg`,
        alt: "Front exterior of Riu House with tropical landscaping",
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
        alt: "Front of Riu House showing glass doors and covered entry",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/frontview.jpg`,
        alt: "Arrival view of Riu House through lush tropical foliage",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/mainentrance.jpg`,
        alt: "Main entrance to Riu House",
        width: 5723,
        height: 3820,
      },
      {
        src: `${GALLERY}/frontwalkway.jpg`,
        alt: "Front walkway and approach to Riu House",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/walkway.jpg`,
        alt: "Landscaped garden walkway leading to Riu House",
        width: 3917,
        height: 5868,
      },
    ],
  },
  {
    labelKey: "poolOutdoor",
    images: [
      {
        src: `${GALLERY}/frontpool.jpg`,
        alt: "Shared swimming pool in front of Riu House",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/poolview.jpg`,
        alt: "Pool deck view across the shared swimming pool",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/pool2.jpg`,
        alt: "Shared pool area with lounge seating beside Riu House",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/pool3.jpg`,
        alt: "Swimming pool surrounded by tropical gardens",
        width: 5924,
        height: 3955,
      },
      {
        src: `${GALLERY}/pool4.jpg`,
        alt: "Poolside view with palm trees and tropical landscaping",
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
        alt: "Pool area with covered terrace beside the swimming pool",
        width: 5772,
        height: 3853,
      },
      {
        src: `${GALLERY}/backdeck.jpg`,
        alt: "Rear covered deck and outdoor seating area",
        width: 5971,
        height: 3986,
      },
      {
        src: `${GALLERY}/backpatio.jpg`,
        alt: "Back patio with tropical garden surroundings",
        width: 5883,
        height: 3927,
      },
      {
        src: `${GALLERY}/backpatio2.jpg`,
        alt: "Covered rear patio for outdoor relaxation",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/backporchtop.jpg`,
        alt: "Upper rear porch overlooking tropical gardens",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/backporchtop2.jpg`,
        alt: "Rear upper terrace with lush outdoor surroundings",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/outdoorshower.jpg`,
        alt: "Outdoor shower surrounded by tropical greenery",
        width: 5922,
        height: 3953,
      },
    ],
  },
  {
    labelKey: "livingArea",
    images: [
      {
        src: `${GALLERY}/lvnarea.jpg`,
        alt: "Living room with television wall and open-concept layout",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/lvnarea2.jpg`,
        alt: "Living room sofa, seating area, and glass doors to the terrace",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/spaces.jpg`,
        alt: "Living area with comfortable seating and natural light",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/spaces2.jpg`,
        alt: "Living room flow between interior seating and outdoor terrace",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/spaces3.jpg`,
        alt: "Living room seating area with tropical views",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/spaces4.jpg`,
        alt: "Living room detail with warm finishes and seating",
        width: 6016,
        height: 4016,
      },
    ],
  },
  {
    labelKey: "kitchenDining",
    images: [
      {
        src: `${GALLERY}/kitchen.jpg`,
        alt: "Kitchen overview with island and modern cabinetry",
        width: 5960,
        height: 3979,
      },
      {
        src: `${GALLERY}/kitchen2.jpg`,
        alt: "Kitchen island with bar seating",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/kitchen3.jpg`,
        alt: "Kitchen appliances, shelves, and counter details",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/kitchen4.jpg`,
        alt: "Kitchen prep area with cabinetry and appliances",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/main-house-dining.jpg`,
        alt: "Indoor dining table and dining area",
        width: 5868,
        height: 3917,
      },
      {
        src: `${GALLERY}/dwnbath.jpg`,
        alt: "Main-floor bathroom with vanity near the living areas",
        width: 4016,
        height: 6016,
      },
      {
        src: `${GALLERY}/dwnbath2.jpg`,
        alt: "Main-floor bathroom shower and vanity",
        width: 4016,
        height: 6016,
      },
      {
        src: `${GALLERY}/dwnbath3.jpg`,
        alt: "Main-floor bathroom with modern fixtures",
        width: 3799,
        height: 5691,
      },
    ],
  },
  {
    labelKey: "mainBedroomBathroom",
    images: [
      {
        src: `${GALLERY}/MainBed.jpg`,
        alt: "Main bedroom queen suite with warm custom finishes",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/mainbed2.jpg`,
        alt: "Main bedroom with built-in storage and television",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/mainbed3.jpg`,
        alt: "Main bedroom suite with terrace access",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/mainbed4.jpg`,
        alt: "Main bedroom with queen bed and private suite details",
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
    labelKey: "backBedroomBathroom",
    images: [
      {
        src: `${GALLERY}/backbed.jpg`,
        alt: "Riu House back bedroom queen suite",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/backbed2.jpg`,
        alt: "Riu House back bedroom with built-in storage and queen bed",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/backbed3.jpg`,
        alt: "Riu House back bedroom with air conditioning and television",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/backbed4.jpg`,
        alt: "Riu House back bedroom with terrace access and warm finishes",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/pinkbath.jpg`,
        alt: "Riu House back bedroom private bathroom with vanity area",
        width: 4016,
        height: 6016,
      },
      {
        src: `${GALLERY}/pinkbath2.jpg`,
        alt: "Riu House back bedroom private en-suite bathroom detail",
        width: 3941,
        height: 5912,
      },
      {
        src: `${GALLERY}/pinkbath3.jpg`,
        alt: "Riu House back bedroom private bathroom shower and vanity",
        width: 4016,
        height: 6016,
      },
    ],
  },
  {
    labelKey: "frontBedroomBathroom",
    images: [
      {
        src: `${GALLERY}/frntbed.jpg`,
        alt: "Front bedroom queen suite",
        width: 3739,
        height: 5601,
      },
      {
        src: `${GALLERY}/frntbed2.jpg`,
        alt: "Front bedroom with built-in storage and en-suite access",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/frntbed3.jpg`,
        alt: "Front bedroom with air conditioning and television",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/frntbed4.jpg`,
        alt: "Front bedroom with balcony doors and queen bed",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/frontbedbath.jpg`,
        alt: "Front bedroom private bathroom with vanity",
        width: 4016,
        height: 6016,
      },
      {
        src: `${GALLERY}/frontbedbath2.jpg`,
        alt: "Front bedroom private en-suite bathroom detail",
        width: 4016,
        height: 6016,
      },
      {
        src: `${GALLERY}/frnttopdeck.jpg`,
        alt: "Front bedroom private covered terrace",
        width: 6016,
        height: 4016,
      },
      {
        src: `${GALLERY}/frnttopdeck2.jpg`,
        alt: "Front bedroom upper balcony with tropical views",
        width: 6016,
        height: 4016,
      },
    ],
  },
];

export const riuHouseGallery: RiuHouseImage[] = riuHouseGallerySections.flatMap(
  (section) => section.images,
);

export const RIU_HOUSE_PATH = "/properties/riu-house";
