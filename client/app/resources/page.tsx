import type { Metadata } from "next";
import  ResourcesPageClient  from "./resources-page-client";

/**
 * Server wrapper -- same fix as the market page: metadata exports are
 * silently dropped from "use client" files, so the listing page
 * previously shipped with no title/description at all. Filters stay
 * client-side in resources-page-client.tsx.
 */
export const metadata: Metadata = {
  title: "Poultry Farming Resources & Guides — AgroSense",
  description:
    "Practical guides on poultry farm management -- flock health, egg production, feed costs, and market prices. Written for Kenyan poultry farmers.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Poultry Farming Resources & Guides — AgroSense",
    description:
      "Practical guides on poultry farm management -- flock health, egg production, feed costs, and market prices.",
    url: "/resources",
    siteName: "AgroSense",
    type: "website",
  },
};

export default function ResourcesPage() {
  return <ResourcesPageClient />;
}