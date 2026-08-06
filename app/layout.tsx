import type { Metadata } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { LanguageProvider } from "./context/LanguageContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const siteTitle = "NuvoHauz | Luxury Stays in Costa Rica & Indianapolis";
const siteDescription =
  "Boutique vacation homes in Costa Rica and Indianapolis, thoughtfully curated for travelers who appreciate exceptional spaces. Book direct for the best rate.";
const siteUrl = "https://nuvohauz.com";
const socialImageUrl = `${siteUrl}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "NuvoHauz",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: socialImageUrl,
        width: 1200,
        height: 1200,
        alt: "NuvoHauz — luxury stays in Costa Rica and Indianapolis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [socialImageUrl],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
