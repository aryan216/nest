import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { brand } from "@/config/brand";
import { categoryPath, propertyMeta } from "@/config/catalog";
import { faqs, faqJsonLd } from "@/content/faq";
import { FadeIn } from "@/components/motion/fade-in";
import { HomeHero } from "@/components/home/home-hero";
import { PropertyCard } from "@/components/property/property-card";
import { JsonLd } from "@/components/seo/json-ld";
import { Eyebrow, FaqAccordion } from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { formatPerSqFt } from "@/lib/format";
import { getPublicMarket } from "@/services/listings";

export const revalidate = 300;

export default async function HomePage() {
  const market = await getPublicMarket();
  return (
    <div>
      <JsonLd data={faqJsonLd()} />
      <HomeHero market={market} />

      <section className="mx-auto max-w-page px-4 pb-10 pt-14 sm:px-6 sm:pt-16 lg:pt-20" aria-labelledby="fresh-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>Just inspected</Eyebrow>
            <h2 id="fresh-heading" className="font-heading text-3xl sm:text-4xl">Fresh verified properties</h2>
          </div>
          <Link href="/search" className={buttonVariants({ variant: "outline" })}>View all verified homes</Link>
        </div>
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          <Link href="/search" className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">
            All ({market.verifiedCount})
          </Link>
          {market.typeCounts.map((item) => (
            <Link key={item.type} href={categoryPath(item.type)} className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-secondary px-4 text-sm font-semibold">
              {propertyMeta(item.type).label} ({item.count})
            </Link>
          ))}
        </div>
        {market.fresh.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border p-8 text-sm text-muted-foreground">Verified homes will show here after the first inspections.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {market.fresh.map((listing, index) => (
              <PropertyCard key={listing.id} listing={listing} priority={index === 0} />
            ))}
          </div>
        )}
      </section>

      {market.rows.map((row) => (
        <section key={row.type} className="mx-auto max-w-page px-4 py-6 sm:px-6" aria-labelledby={`${row.type}-row`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id={`${row.type}-row`} className="font-heading text-2xl sm:text-3xl">{propertyMeta(row.type).plural} in {brand.city}</h2>
            <Link href={categoryPath(row.type)} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold" aria-label={`Browse all ${propertyMeta(row.type).plural.toLowerCase()} in ${brand.city}`}>
              See all <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {row.listings.map((listing) => (
              <div key={listing.id} className="w-[85%] shrink-0 snap-start sm:w-[46%] xl:w-[31%]">
                <PropertyCard listing={listing} />
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-page px-4 py-10 sm:px-6" aria-labelledby="locality-heading">
        <Eyebrow>Inside {brand.city}</Eyebrow>
        <h2 id="locality-heading" className="font-heading text-3xl">Browse by locality</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {market.localities.map((locality) => (
            <Link key={locality.slug} href={`/locality/${locality.slug}`} className="card-lift rounded-2xl border border-border bg-card p-4 shadow-soft">
              <h3 className="font-heading text-xl">{locality.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{locality.count} verified {locality.count === 1 ? "home" : "homes"}</p>
              <p className="mt-1 text-sm font-semibold">{formatPerSqFt(locality.averagePricePerSqFt)} average</p>
            </Link>
          ))}
        </div>
      </section>

      <FadeIn className="mx-auto max-w-page px-4 py-10 sm:px-6">
        <Eyebrow>The badge</Eyebrow>
        <h2 className="font-heading text-3xl sm:text-4xl">How a home earns Verified</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["1", "Listed", "A partner submits the home with photos and papers. It is not public yet."],
            ["2", "Inspected in person", "A NestVerify inspector visits, measures the area, and checks the approval."],
            ["3", "Goes live as Verified", "Only then can buyers see it, with the checklist and the inspection date."],
          ].map(([step, title, copy]) => (
            <li key={step} className="rounded-3xl border border-border bg-card p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent font-heading text-lg text-accent-foreground">{step}</span>
              <h3 className="mt-4 font-heading text-2xl">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
            </li>
          ))}
        </ol>
        <Link href="/sample-report" className="mt-5 inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline">
          Read a sample verification report
        </Link>
      </FadeIn>

      {market.testimonials.length > 0 ? (
        <section className="mx-auto max-w-page px-4 py-10 sm:px-6" aria-labelledby="stories-heading">
          <Eyebrow>{market.testimonials.some((item) => item.isSample) ? "Sample stories" : "From buyers"}</Eyebrow>
          <h2 id="stories-heading" className="font-heading text-3xl">What people say after a visit</h2>
          {market.testimonials.some((item) => item.isSample) ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">These are sample quotes so the section has a shape. Replace them with real buyer words before launch.</p>
          ) : null}
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {market.testimonials.map((item) => (
              <figure key={item.id} className="rounded-3xl border border-border bg-card p-5">
                <blockquote className="text-sm leading-6">“{item.quote}”</blockquote>
                <figcaption className="mt-4 text-sm font-semibold">{item.name}<span className="block font-normal text-muted-foreground">{item.role}</span></figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-page px-4 py-10 sm:px-6" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="mb-5 font-heading text-3xl">Questions buyers ask</h2>
        <FaqAccordion items={faqs} />
      </section>

      <section className="mx-auto max-w-page px-4 pb-16 sm:px-6">
        <div className="rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-10">
          <h2 className="font-heading text-3xl sm:text-4xl">List a property you can stand behind</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/90">No joining fee. Commission is agreed in writing. The badge comes only after an in-person audit.</p>
          <Link href="/join" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#4673eb] transition-colors hover:bg-[#e8effc]">
            Become a Partner
          </Link>
        </div>
      </section>
    </div>
  );
}
