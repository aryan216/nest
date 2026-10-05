import Link from "next/link";
import { ArrowRight, ClipboardCheck, Home, MapPinned } from "lucide-react";
import { brand } from "@/config/brand";
import { categoryPath, propertyMeta } from "@/config/catalog";
import { faqs, faqJsonLd } from "@/content/faq";
import { FadeIn } from "@/components/motion/fade-in";
import { HeroSearch } from "@/components/home/hero-search";
import { RotatingWord } from "@/components/home/rotating-word";
import { PropertyCard } from "@/components/property/property-card";
import { JsonLd } from "@/components/seo/json-ld";
import { Eyebrow, FaqAccordion } from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { formatCount, formatPerSqFt } from "@/lib/format";
import type { PublicMarket } from "@/services/listings";

export function HomeView({ market }: { market: PublicMarket }) {
  const soon = market.comingSoon.join(", ");
  return (
    <>
      <JsonLd data={faqJsonLd()} />
      <section className="mx-auto grid max-w-page gap-8 px-4 pb-8 pt-8 sm:px-6 sm:pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <Eyebrow>Verified property in {brand.city}</Eyebrow>
          <h1 className="font-heading text-4xl leading-tight text-balance sm:text-6xl">
            Find a <RotatingWord /> that has actually been seen
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Every listing is walked through by our own team before it goes live. Buyers pay no brokerage. Your phone number stays with {brand.name}.
          </p>
        </div>
        <HeroSearch localities={market.localities} />
      </section>

      <section aria-label="Live totals" className="mx-auto grid max-w-page gap-3 px-4 sm:grid-cols-3 sm:px-6">
        <Stat label="Verified properties" value={formatCount(market.verifiedCount)} />
        <Stat label={`Localities in ${brand.city}`} value={formatCount(market.localityCount)} />
        <Stat label="On-site inspections" value={formatCount(market.inspectionCount)} />
      </section>
      <p className="mx-auto mt-4 max-w-page px-4 text-sm text-muted-foreground sm:px-6">
        {soon} are coming soon. This desk verifies homes in {brand.city} only.
      </p>

      <section className="mx-auto mt-16 max-w-page px-4 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Just inspected</Eyebrow>
            <h2 className="font-heading text-3xl sm:text-4xl">Fresh verified properties</h2>
          </div>
          <Link href="/search" className={buttonVariants({ variant: "outline" })}>
            View all verified homes
          </Link>
        </div>
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          <Link href="/search" className="min-h-11 shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            All · {formatCount(market.verifiedCount)}
          </Link>
          {market.typeCounts.map((item) => (
            <Link key={item.type} href={categoryPath(item.type)} className="min-h-11 shrink-0 rounded-full bg-secondary px-4 py-2 text-sm font-semibold">
              {propertyMeta(item.type).label} · {formatCount(item.count)}
            </Link>
          ))}
        </div>
        {market.fresh.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {market.fresh.map((listing, index) => (
              <PropertyCard key={listing.id} listing={listing} priority={index === 0} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border p-8 text-muted-foreground">Verified homes will show here once the first inspections are filed.</p>
        )}
      </section>

      {market.rows.map((row) => (
        <section key={row.type} className="mx-auto mt-14 max-w-page px-4 sm:px-6" aria-labelledby={`row-${row.type}`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id={`row-${row.type}`} className="font-heading text-2xl sm:text-3xl">
              {propertyMeta(row.type).plural} in {brand.city}
            </h2>
            <Link href={categoryPath(row.type)} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary">
              See all
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {row.listings.map((listing) => (
              <div key={listing.id} className="w-[82%] shrink-0 snap-start sm:w-[46%] xl:w-[31%]">
                <PropertyCard listing={listing} />
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="mx-auto mt-16 max-w-page px-4 sm:px-6">
        <Eyebrow>Inside {brand.city}</Eyebrow>
        <h2 className="font-heading text-3xl sm:text-4xl">Browse by locality</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {market.localities.map((locality) => (
            <Link key={locality.slug} href={`/locality/${locality.slug}`} className="card-lift rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h3 className="font-heading text-2xl">{locality.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{formatCount(locality.count)} verified {locality.count === 1 ? "home" : "homes"}</p>
              <p className="mt-4 text-sm font-semibold">{formatPerSqFt(locality.averagePricePerSqFt)} average</p>
            </Link>
          ))}
        </div>
      </section>

      <FadeIn className="mx-auto mt-16 max-w-page px-4 sm:px-6">
        <Eyebrow>The badge</Eyebrow>
        <h2 className="font-heading text-3xl sm:text-4xl">How a home earns Verified</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          <Step icon={<Home className="h-5 w-5" aria-hidden />} title="Listed" body="A partner submits the home with photos, the address, and the papers they want checked." />
          <Step icon={<MapPinned className="h-5 w-5" aria-hidden />} title="Inspected in person" body={`A ${brand.name} inspector visits, measures the area, and checks the named approving authority.`} />
          <Step icon={<ClipboardCheck className="h-5 w-5" aria-hidden />} title="Goes live as Verified" body="Only then can buyers see it, with the checklist and the inspection date attached." />
        </ol>
        <Link href="/sample-report" className="mt-6 inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
          Read a sample verification report
        </Link>
      </FadeIn>

      {market.testimonials.length > 0 ? (
        <section className="mx-auto mt-16 max-w-page px-4 sm:px-6">
          <Eyebrow>Voices</Eyebrow>
          <h2 className="font-heading text-3xl sm:text-4xl">Sample stories</h2>
          {market.testimonials.some((item) => item.isSample) ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">These are sample quotes so the section has a shape. Replace them with real buyer words before launch.</p>
          ) : null}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {market.testimonials.map((item) => (
              <figure key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <blockquote className="text-base leading-7">“{item.quote}”</blockquote>
                <figcaption className="mt-4 text-sm font-semibold">
                  {item.name}
                  <span className="mt-1 block font-normal text-muted-foreground">{item.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto mt-16 max-w-page px-4 sm:px-6">
        <Eyebrow>Questions</Eyebrow>
        <h2 className="mb-6 font-heading text-3xl sm:text-4xl">Before you enquire</h2>
        <FaqAccordion items={faqs} />
      </section>

      <section className="mx-auto mt-16 max-w-page px-4 sm:px-6">
        <div className="rounded-3xl bg-primary px-6 py-10 text-primary-foreground sm:px-10">
          <h2 className="font-heading text-3xl sm:text-4xl">List a property you can stand behind</h2>
          <p className="mt-3 max-w-2xl text-primary-foreground/90">
            No joining fee. Commission is agreed in writing. The Verified badge comes only after an in-person audit in {brand.city}.
          </p>
          <Link href="/join" className={buttonVariants({ variant: "accent", size: "lg", className: "mt-6" })}>
            Become a Partner
          </Link>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-soft">
      <p className="font-heading text-3xl tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Step({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <li className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">{icon}</span>
      <h3 className="mt-4 font-heading text-2xl">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </li>
  );
}
