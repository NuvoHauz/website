import type { PropertyKey } from "../i18n";

export interface PropertyData {
  key: PropertyKey;
  image: string;
  comingSoon?: boolean;
  airbnbUrl?: string;
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
        key: "mainHouse",
        image: "/images/properties/casa-nuvo.jpg",
        comingSoon: true,
      },
      {
        key: "cabin1",
        image: "/images/properties/cozy-cabin.jpg",
        airbnbUrl: "https://www.airbnb.com/rooms/1541419403455876965",
      },
      {
        key: "cabin2",
        image: "/images/properties/tropical-cabin.jpg",
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
