import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/partner", "/api", "/saved", "/login"] },
    sitemap: `${brand.siteUrl}/sitemap.xml`,
  };
}
