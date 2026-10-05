import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brand } from "@/config/brand";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PropertyCard } from "@/components/property/property-card";
import { formatCount, formatPerSqFt } from "@/lib/format";
import { getPublicMarket } from "@/services/listings";

export const revalidate = 300;

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  try {
    const market = await getPublicMarket();
    return market.localities.map((locality) => ({ slug: locality.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const market = await getPublicMarket();
  const locality = market.localities.find((item) => item.slug === params.slug);
  if (!locality) return { title: "Locality not found" };
  return {
    title: `Verified homes in ${locality.name}, ${brand.city}`,
    description: `${locality.count} physically verified homes in ${locality.name}, ${brand.city}. Average ${formatPerSqFt(locality.averagePricePerSqFt)}.`,
    alternates: { canonical: `/locality/${locality.slug}` },
  };
}

export default async function LocalityPage({ params }: PageProps) {
  const market = await getPublicMarket();
  const locality = market.localities.find((item) => item.slug === params.slug);
  if (!locality) notFound();
  const listings = market.listings.filter((listing) => listing.locality.slug === locality.slug);
  if (listings.length === 0) notFound();
  const title = `Verified homes in ${locality.name}`;
  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: brand.siteUrl },
            { "@type": "ListItem", position: 2, name: title, item: `${brand.siteUrl}/locality/${locality.slug}` },
          ],
        }}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: `${brand.city}`, href: "/search" }, { label: locality.name }]} />
      <h1 className="mt-4 font-heading text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {formatCount(locality.count)} verified {locality.count === 1 ? "home" : "homes"} · average {formatPerSqFt(locality.averagePricePerSqFt)}
      </p>
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing) => <PropertyCard key={listing.id} listing={listing} />)}
      </div>
    </div>
  );
}
