import type { MetadataRoute } from "next";

const SITE_URL = "https://agrosense.example.com"; // TODO: real domain, keep in sync with sitemap.ts

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/register", "/login"], // adjust to real private routes
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}