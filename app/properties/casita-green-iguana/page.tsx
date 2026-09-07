import type { Metadata } from "next";
import CabinPropertyPage from "../../components/CabinPropertyPage";
import {
  casitaGreenIguanaGallery,
  casitaGreenIguanaHero,
} from "../../data/casita-green-iguana-gallery";

const title = "Casita Green Iguana | NuvoHauz Stay in Paquera, Costa Rica";
const description =
  "Casita Green Iguana is a modern tropical escape surrounded by lush gardens with access to the shared pool. Minutes from Isla Tortuga, Curu Wildlife Refuge, and incredible bioluminescence tours.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [
      {
        url: casitaGreenIguanaHero.src,
        alt: casitaGreenIguanaHero.alt,
      },
    ],
  },
};

export default function CasitaGreenIguanaRoute() {
  return (
    <CabinPropertyPage
      propertyKey="cabin2"
      shortLabel="Casita Green Iguana"
      hero={casitaGreenIguanaHero}
      gallery={casitaGreenIguanaGallery}
      airbnbUrl="https://www.airbnb.com/rooms/1447441204879224703"
    />
  );
}
