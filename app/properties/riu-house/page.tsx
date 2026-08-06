import type { Metadata } from "next";
import RiuHousePage from "../../components/RiuHousePage";

const title = "Riu House at NuvoHauz | Luxury Stay in Paquera, Costa Rica";
const description =
  "Riu House is a modern tropical retreat in Paquera, Costa Rica with three queen-bedroom suites, a shared swimming pool, and river-facing views. Inquire directly with NuvoHauz.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [
      {
        url: "/images/properties/casa-nuvo.jpg",
        alt: "Exterior of Riu House in Paquera, Costa Rica",
      },
    ],
  },
};

export default function RiuHouseRoute() {
  return <RiuHousePage />;
}
