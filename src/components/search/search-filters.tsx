"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { SlidersHorizontal, X } from "lucide-react";
import { APPROVING_AUTHORITIES } from "@/config/catalog";
import { possessionLabel, PROPERTY_CATALOG } from "@/config/catalog";
import { POSSESSION_STATUSES, type PropertyType } from "@/types/domain";
import { searchHref } from "@/lib/search";
import type { SearchQuery } from "@/validations/schemas";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const SLIDER_MAX = 50000000;

export function SearchFilters({
  query,
  localities,
  authorities,
  typeCounts,
}: {
  query: SearchQuery;
  localities: { name: string; slug: string; count: number }[];
  authorities: string[];
  typeCounts: { type: PropertyType; count: number }[];
}) {
  const [open, setOpen] = useState(false);
  const [budget, setBudget] = useState<[number, number]>([query.budgetMin ?? 0, query.budgetMax ?? SLIDER_MAX]);
  const authorityOptions = useMemo(() => {
    const values = new Set<string>([...authorities, ...APPROVING_AUTHORITIES]);
    return [...values];
  }, [authorities]);
  const activeTypes = typeCounts.length > 0 ? PROPERTY_CATALOG.filter((item) => typeCounts.some((entry) => entry.type === item.type)) : PROPERTY_CATALOG;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <button type="button" className={buttonVariants({ variant: "outline" })} onClick={() => setOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filters
        </button>
        <Link href="/search" className="text-sm font-semibold underline-offset-4 hover:underline">
          Clear filters
        </Link>
      </div>
      <form
        id="search-filters"
        action="/search"
        className={cn(
          "space-y-5 rounded-3xl border border-border bg-card p-4 shadow-soft",
          open ? "fixed inset-x-0 bottom-0 z-40 max-h-[85vh] overflow-auto rounded-b-none" : "hidden lg:block",
        )}
      >
        <div className="flex items-center justify-between lg:hidden">
          <h2 className="font-heading text-xl">Filters</h2>
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-secondary" aria-label="Close filters" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <input type="hidden" name="budgetMin" value={budget[0] > 0 ? budget[0] : ""} />
        <input type="hidden" name="budgetMax" value={budget[1] < SLIDER_MAX ? budget[1] : ""} />
        {query.view === "map" ? <input type="hidden" name="view" value="map" /> : null}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Property type</legend>
          <select name="type" defaultValue={query.type ?? ""} className="min-h-11 w-full rounded-xl border border-input bg-card px-3">
            <option value="">All types</option>
            {activeTypes.map((item) => (
              <option key={item.type} value={item.type}>
                {item.label}
              </option>
            ))}
          </select>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Locality</legend>
          <div className="max-h-48 space-y-2 overflow-auto pr-1">
            {localities.map((locality) => (
              <label key={locality.slug} className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" name="locality" value={locality.slug} defaultChecked={query.locality?.includes(locality.slug)} className="h-4 w-4" />
                {locality.name}
                <span className="text-muted-foreground">({locality.count})</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Budget</legend>
          <Slider.Root
            className="relative flex h-11 w-full touch-none items-center"
            min={0}
            max={SLIDER_MAX}
            step={100000}
            value={budget}
            onValueChange={(value) => {
              const min = value[0] ?? 0;
              const max = value[1] ?? SLIDER_MAX;
              setBudget([min, max]);
            }}
            minStepsBetweenThumbs={1}
          >
            <Slider.Track className="relative h-1.5 grow rounded-full bg-muted">
              <Slider.Range className="absolute h-full rounded-full bg-primary" />
            </Slider.Track>
            <Slider.Thumb aria-label="Minimum budget" className="block h-6 w-6 rounded-full border-2 border-primary bg-card" />
            <Slider.Thumb aria-label="Maximum budget" className="block h-6 w-6 rounded-full border-2 border-primary bg-card" />
          </Slider.Root>
          <p className="text-sm text-muted-foreground">
            {budget[0] <= 0 ? "No minimum" : `From ₹${(budget[0] / 100000).toFixed(0)} L`}
            {" · "}
            {budget[1] >= SLIDER_MAX ? "No maximum" : `Up to ₹${(budget[1] / 10000000).toFixed(2)} Cr`}
          </p>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">BHK</legend>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((bhk) => (
              <label key={bhk} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-3 text-sm">
                <input type="checkbox" name="bhk" value={bhk} defaultChecked={query.bhk?.includes(bhk)} />
                {bhk} BHK
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="areaMin">Min area</Label>
            <input id="areaMin" name="areaMin" type="number" min={0} defaultValue={query.areaMin ?? ""} placeholder="sq ft" className="min-h-11 w-full rounded-xl border border-input bg-card px-3" />
          </div>
          <div>
            <Label htmlFor="areaMax">Max area</Label>
            <input id="areaMax" name="areaMax" type="number" min={0} defaultValue={query.areaMax ?? ""} placeholder="sq ft" className="min-h-11 w-full rounded-xl border border-input bg-card px-3" />
          </div>
        </div>
        <div>
          <Label htmlFor="authority">Approving authority</Label>
          <select id="authority" name="authority" defaultValue={query.authority ?? ""} className="min-h-11 w-full rounded-xl border border-input bg-card px-3">
            <option value="">Any</option>
            {authorityOptions.map((authority) => (
              <option key={authority} value={authority}>
                {authority}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="possession">Possession</Label>
          <select id="possession" name="possession" defaultValue={query.possession ?? ""} className="min-h-11 w-full rounded-xl border border-input bg-card px-3">
            <option value="">Any</option>
            {POSSESSION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {possessionLabel(status)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button className={buttonVariants()} type="submit">
            Apply filters
          </button>
          <Link href={searchHref({ view: query.view })} className={buttonVariants({ variant: "outline" })}>
            Clear filters
          </Link>
        </div>
      </form>
      {open ? <button type="button" aria-label="Dismiss filters" className="fixed inset-0 z-30 bg-foreground/40 lg:hidden" onClick={() => setOpen(false)} /> : null}
    </>
  );
}
