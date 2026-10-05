import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brand } from "@/config/brand";
import { categoryPath, propertyMeta, parseSeoSlug } from "@/config/catalog";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PropertyCard } from "@/components/property/property-card";
import { formatCount } from "@/lib/format";
import { getPublicMarket } from "@/services/listings";
import { connectDB } from "@/lib/db";
import { CityModel } from "@/models";
import { readCity } from "@/lib/readers";

export const revalidate = 300;
export const dynamicParams = true;

interface PageProps {
  params: { seoSlug: string };
}

export async function generateStaticParams() {
  try {
    const market = await getPublicMarket();
    return market.typeCounts.map((item) => ({ seoSlug: categoryPath(item.type).slice(1) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const parsed = parseSeoSlug(params.seoSlug);
  if (!parsed) return { title: "Not found" };
  const meta = propertyMeta(parsed.type);
  const cityName = parsed.citySlug === brand.citySlug ? brand.city : parsed.citySlug;
  return {
    title: `Verified ${meta.plural.toLowerCase()} in ${cityName}`,
    description: `Physically verified ${meta.plural.toLowerCase()} in ${cityName}. Buyers pay no brokerage on ${brand.name}.`,
    alternates: { canonical: `/${params.seoSlug}` },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const parsed = parseSeoSlug(params.seoSlug);
  if (!parsed) notFound();
  if (parsed.citySlug !== brand.citySlug) {
    await connectDB().catch(() => null);
    const doc: unknown = await CityModel().findOne({ slug: parsed.citySlug }).lean().catch(() => null);
    const city = readCity(doc);
    if (!city) notFound();
    return (
      <div className="mx-auto max-w-page px-4 py-16 sm:px-6">
        <h1 className="font-heading text-4xl">{propertyMeta(parsed.type).plural} in {city.name}</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">Coming soon. {brand.name} currently verifies homes in {brand.city} only.</p>
      </div>
    );
  }
  const market = await getPublicMarket();
  const listings = market.listings.filter((listing) => listing.propertyType === parsed.type);
  if (listings.length === 0) notFound();
  const meta = propertyMeta(parsed.type);
  const title = `Verified ${meta.plural.toLowerCase()} in ${brand.city}`;
  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: brand.siteUrl },
            { "@type": "ListItem", position: 2, name: title, item: `${brand.siteUrl}/${params.seoSlug}` },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: title,
          itemListElement: listings.map((listing, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: listing.title,
            url: `${brand.siteUrl}/property/${listing.slug}`,
          })),
        }}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />
      <h1 className="mt-4 font-heading text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{formatCount(listings.length)} verified {listings.length === 1 ? "home" : "homes"}. Each one was inspected in person.</p>
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing) => <PropertyCard key={listing.id} listing={listing} />)}
      </div>
    </div>
  );
}
