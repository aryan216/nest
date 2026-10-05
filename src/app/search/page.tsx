import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/config/brand";
import { PropertyCard } from "@/components/property/property-card";
import { SearchFilters } from "@/components/search/search-filters";
import { SearchMapLoader } from "@/components/search/map-loader";
import { formatCount } from "@/lib/format";
import { parseSearchQuery, searchHref } from "@/lib/search";
import { getPublicMarket, searchListings } from "@/services/listings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Search verified homes in ${brand.city}`,
  description: `Filter physically verified homes in ${brand.city} by locality, budget, BHK and approving authority.`,
  alternates: { canonical: "/search" },
};

export default async function SearchPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const query = parseSearchQuery(searchParams);
  const [market, results] = await Promise.all([getPublicMarket(), searchListings(query)]);
  const mapView = query.view === "map";
  return (
    <div className="mx-auto grid max-w-page gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[18rem_1fr]">
      <SearchFilters query={query} localities={market.localities} authorities={market.authorities} typeCounts={market.typeCounts} />
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl">Verified homes in {brand.city}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{formatCount(results.total)} verified {results.total === 1 ? "home" : "homes"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={searchHref(query, { view: "list", page: 1 })} className={mapView ? "min-h-11 rounded-full px-4 py-2 text-sm font-semibold" : "min-h-11 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"} aria-current={mapView ? undefined : "page"}>
              Show list
            </Link>
            <Link href={searchHref(query, { view: "map", page: 1 })} className={mapView ? "min-h-11 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" : "min-h-11 rounded-full px-4 py-2 text-sm font-semibold"} aria-current={mapView ? "page" : undefined}>
              Show map
            </Link>
            <label className="text-sm font-semibold" htmlFor="sort">
              Sort
              <select id="sort" name="sort" form="search-filters" defaultValue={query.sort ?? "newest"} className="ml-2 min-h-11 rounded-xl border border-input bg-card px-3">
                <option value="newest">Newest</option>
                <option value="price_asc">Price, low to high</option>
                <option value="price_desc">Price, high to low</option>
                <option value="ppsf_asc">Price per sq ft, low</option>
                <option value="ppsf_desc">Price per sq ft, high</option>
              </select>
            </label>
            <button type="submit" form="search-filters" className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold">
              Apply sort
            </button>
          </div>
        </div>
        {results.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8">
            <h2 className="font-heading text-2xl">No verified homes match these filters</h2>
            <p className="mt-2 text-sm text-muted-foreground">Try a wider budget or clear a locality. Only inspected homes are listed.</p>
            <Link href="/search" className="mt-4 inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline">Clear filters</Link>
          </div>
        ) : mapView ? (
          <SearchMapLoader listings={results.items} />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {results.items.map((listing) => <PropertyCard key={listing.id} listing={listing} />)}
          </div>
        )}
        {results.totalPages > 1 ? (
          <nav aria-label="Search pages" className="mt-6 flex flex-wrap gap-2">
            {results.page > 1 ? <Link className="inline-flex min-h-11 items-center rounded-full border border-border px-4" href={searchHref(query, { page: results.page - 1 })}>Previous page</Link> : null}
            <span className="inline-flex min-h-11 items-center px-2 text-sm">Page {results.page} of {results.totalPages}</span>
            {results.page < results.totalPages ? <Link className="inline-flex min-h-11 items-center rounded-full border border-border px-4" href={searchHref(query, { page: results.page + 1 })}>Next page</Link> : null}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
