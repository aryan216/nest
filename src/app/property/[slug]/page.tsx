import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brand } from "@/config/brand";
import { categoryPath, furnishingLabel, possessionLabel, propertyMeta } from "@/config/catalog";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { EnquiryForm } from "@/components/property/enquiry-form";
import { SaveListingButton } from "@/components/property/save-listing-button";
import { PropertyGallery } from "@/components/property/gallery";
import { PropertyCard } from "@/components/property/property-card";
import { VerificationSummary } from "@/components/property/verification-summary";
import { SearchMapLoader } from "@/components/search/map-loader";
import { formatArea, formatDate, formatPerSqFt, formatPriceINR } from "@/lib/format";
import { getPublicMarket, getSimilarListings, getVerifiedListing } from "@/services/listings";
import { getPublicVerification } from "@/services/verification";

export const revalidate = 300;

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  try {
    const market = await getPublicMarket();
    return market.listings.map((listing) => ({ slug: listing.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const listing = await getVerifiedListing(params.slug);
  if (!listing) return { title: "Home not found" };
  const description = `${listing.title} in ${brand.city}. ${formatArea(listing.areaSqFt)}, ${formatPriceINR(listing.price)}. Physically verified by ${brand.name}.`;
  return {
    title: listing.title,
    description,
    alternates: { canonical: `/property/${listing.slug}` },
    openGraph: {
      title: listing.title,
      description,
      images: listing.images[0] ? [{ url: listing.images[0].url, alt: listing.images[0].alt }] : undefined,
    },
  };
}

export default async function PropertyPage({ params }: PageProps) {
  const listing = await getVerifiedListing(params.slug);
  if (!listing) notFound();
  const [similar, verification] = await Promise.all([getSimilarListings(listing), getPublicVerification(listing.id)]);
  const whatsapp = `https://wa.me/${brand.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${brand.name}, I have a question about ${listing.title}.`)}`;
  const facts = [
    ["Type", propertyMeta(listing.propertyType).label],
    ["Area", formatArea(listing.areaSqFt)],
    ["Price / sq ft", formatPerSqFt(listing.pricePerSqFt)],
    ["Authority", listing.approvingAuthority || "Not stated"],
    ["Possession", possessionLabel(listing.possessionStatus)],
    ["Furnishing", furnishingLabel(listing.furnishing)],
    ["Floor", listing.floor !== null && listing.totalFloors !== null ? `${listing.floor} of ${listing.totalFloors}` : "Not stated"],
    ["Facing", listing.facing || "Not stated"],
    ["Age", listing.ageYears !== null ? `${listing.ageYears} years` : "Not stated"],
    ["BHK", listing.bhk ? `${listing.bhk} BHK` : "Not applicable"],
  ];
  return (
    <div className="mx-auto max-w-page px-4 py-6 pb-28 sm:px-6 lg:pb-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          name: listing.title,
          description: listing.description,
          url: `${brand.siteUrl}/property/${listing.slug}`,
          image: listing.images.map((image) => image.url),
          datePosted: listing.verifiedAt,
          address: {
            "@type": "PostalAddress",
            streetAddress: listing.address,
            addressLocality: listing.locality.name,
            addressRegion: brand.state,
            addressCountry: "IN",
          },
          offers: { "@type": "Offer", price: listing.price, priceCurrency: "INR" },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: brand.siteUrl },
            { "@type": "ListItem", position: 2, name: `${propertyMeta(listing.propertyType).plural} in ${brand.city}`, item: `${brand.siteUrl}${categoryPath(listing.propertyType)}` },
            { "@type": "ListItem", position: 3, name: listing.title, item: `${brand.siteUrl}/property/${listing.slug}` },
          ],
        }}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: `${propertyMeta(listing.propertyType).plural} in ${brand.city}`, href: categoryPath(listing.propertyType) },
          { label: listing.locality.name, href: `/locality/${listing.locality.slug}` },
          { label: listing.title },
        ]}
      />
      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-8">
          <PropertyGallery images={listing.images} title={listing.title} />
          <div>
            <p className="text-sm font-semibold text-muted-foreground">{listing.locality.name}, {brand.city}</p>
            <h1 className="mt-1 font-heading text-3xl sm:text-5xl">{listing.title}</h1>
            <p className="mt-3 font-heading text-3xl">{formatPriceINR(listing.price)}</p>
            <p className="text-sm text-muted-foreground">{formatArea(listing.areaSqFt)} · {formatPerSqFt(listing.pricePerSqFt)} · Verified {formatDate(listing.verifiedAt)}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {facts.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-card p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <section>
            <h2 className="font-heading text-2xl">About this home</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{listing.description}</p>
          </section>
          {listing.amenities.length > 0 ? (
            <section>
              <h2 className="font-heading text-2xl">Amenities</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {listing.amenities.map((amenity) => (
                  <li key={amenity} className="rounded-full bg-secondary px-3 py-2 text-sm">{amenity}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {verification ? <VerificationSummary verifiedAt={verification.verifiedAt} notes={verification.notes} checklist={verification.checklist} /> : null}
          <section>
            <h2 className="mb-3 font-heading text-2xl">Location</h2>
            <SearchMapLoader listings={[listing]} />
            <a className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:underline" href={`https://www.openstreetmap.org/?mlat=${listing.lat}&mlon=${listing.lng}#map=16/${listing.lat}/${listing.lng}`} target="_blank" rel="noreferrer">
              Open this location in OpenStreetMap
            </a>
          </section>
        </div>
        <aside className="hidden h-fit space-y-4 lg:sticky lg:top-24 lg:block">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">Asking price</p>
            <p className="font-heading text-4xl">{formatPriceINR(listing.price)}</p>
            <div className="mt-4">
              <EnquiryForm listingId={listing.id} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <SaveListingButton id={listing.id} title={listing.title} />
              <a className="inline-flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:underline" href={whatsapp} target="_blank" rel="noreferrer">
                WhatsApp {brand.name}
              </a>
            </div>
          </div>
        </aside>
      </div>
      {similar.length > 0 ? (
        <section className="mt-12" aria-labelledby="similar-heading">
          <h2 id="similar-heading" className="mb-4 font-heading text-3xl">Similar verified homes</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {similar.map((item) => <PropertyCard key={item.id} listing={item} />)}
          </div>
        </section>
      ) : null}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card p-3 lg:hidden">
        <div className="mx-auto flex max-w-page items-center gap-2">
          <SaveListingButton id={listing.id} title={listing.title} />
          <a href={whatsapp} className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold" target="_blank" rel="noreferrer">WhatsApp</a>
          <details className="ml-auto">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Enquire</summary>
            <div className="fixed inset-x-0 bottom-16 z-40 max-h-[70vh] overflow-auto border-t border-border bg-card p-4">
              <EnquiryForm listingId={listing.id} />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
