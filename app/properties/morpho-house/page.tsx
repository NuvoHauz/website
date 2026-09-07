import type { Metadata } from "next";
import CabinPropertyPage from "../../components/CabinPropertyPage";
import {
  morphoHouseGallery,
  morphoHouseHero,
} from "../../data/morpho-house-gallery";

const title = "Morpho House | NuvoHauz Stay in Paquera, Costa Rica";
const description =
  "Morpho House is a peaceful tropical retreat near Isla Tortuga, Curu Wildlife Refuge, and the famous Bioluminescence Tour. Perfect for couples and small families looking to experience Costa Rica's natural beauty.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [
      {
        url: morphoHouseHero.src,
        alt: morphoHouseHero.alt,
      },
    ],
  },
};

export default function MorphoHouseRoute() {
  return (
    <CabinPropertyPage
      propertyKey="cabin1"
      shortLabel="Morpho House"
      hero={morphoHouseHero}
      gallery={morphoHouseGallery}
      airbnbUrl="https://www.airbnb.com/rooms/1541419403455876965"
    />
  );
}
