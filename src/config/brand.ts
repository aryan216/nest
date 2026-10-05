/**
 * Single source for the public brand and the city that is live.
 * Rename the product or launch city here, then reseed the database.
 */
export const brand = {
  name: "NestVerify",
  city: "Lucknow",
  citySlug: "lucknow",
  state: "Uttar Pradesh",
  comingSoonCities: [
    { name: "Kanpur", slug: "kanpur" },
    { name: "Prayagraj", slug: "prayagraj" },
    { name: "Varanasi", slug: "varanasi" },
  ],
  supportEmail: "hello@nestverify.example",
  phoneDisplay: "0522 400 2100",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919876500000",
  addressLines: ["Halwasiya House, 4th floor", "Hazratganj", "Lucknow 226001"],
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
} as const;

export type ComingSoonCity = (typeof brand.comingSoonCities)[number];
