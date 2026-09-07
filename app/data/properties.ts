import type { PropertyKey } from "../i18n";

export interface PropertyData {
  key: PropertyKey;
  image: string;
  comingSoon?: boolean;
  airbnbUrl?: string;
  detailPath?: string;
}

export interface PropertyCollectionData {
  destinationKey: "costaRica" | "indianapolis";
  properties: PropertyData[];
}

export const propertyCollections: PropertyCollectionData[] = [
  {
    destinationKey: "costaRica",
    properties: [
      {
        key: "riuHouse",
        image: "/images/properties/riu-house/hero/pool.jpg",
        detailPath: "/properties/riu-house",
      },
      {
        key: "cabin1",
        image:
          "/images/properties/morpho-house/hero/morpho-house-bedroom-garden-view-built-in-bed.webp",
        detailPath: "/properties/morpho-house",
        airbnbUrl: "https://www.airbnb.com/rooms/1541419403455876965",
      },
      {
        key: "cabin2",
        image:
          "/images/properties/casita-green-iguana/hero/casita-green-iguana-terrace-entrance-unit-2-evening.webp",
        detailPath: "/properties/casita-green-iguana",
        airbnbUrl: "https://www.airbnb.com/rooms/1447441204879224703",
      },
    ],
  },
  {
    destinationKey: "indianapolis",
    properties: [
      {
        key: "banksyHouse",
        image: "/images/properties/banksy-house.jpg",
        airbnbUrl: "https://www.airbnb.com/rooms/720155055377531783",
      },
      {
        key: "carriageHouse",
        image: "/images/properties/carriage-house.jpg",
        airbnbUrl: "https://www.airbnb.com/rooms/52694269",
      },
    ],
  },
];
