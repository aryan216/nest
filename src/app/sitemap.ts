import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
import { categoryPath } from "@/config/catalog";
import { getPublicMarket } from "@/services/listings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const market = await getPublicMarket().catch(() => null);
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: brand.siteUrl, lastModified: now },
    { url: `${brand.siteUrl}/search`, lastModified: now },
    { url: `${brand.siteUrl}/join`, lastModified: now },
    { url: `${brand.siteUrl}/sample-report`, lastModified: now },
  ];
  if (!market) return staticRoutes;
  const categories = market.typeCounts.map((item) => ({
    url: `${brand.siteUrl}${categoryPath(item.type)}`,
    lastModified: now,
  }));
  const localities = market.localities.map((locality) => ({
    url: `${brand.siteUrl}/locality/${locality.slug}`,
    lastModified: now,
  }));
  const properties = market.listings.map((listing) => ({
    url: `${brand.siteUrl}/property/${listing.slug}`,
    lastModified: new Date(listing.verifiedAt),
  }));
  return [...staticRoutes, ...categories, ...localities, ...properties];
}
