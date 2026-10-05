"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { formatArea, formatPerSqFt, formatPriceINR } from "@/lib/format";
import { furnishingLabel, possessionLabel } from "@/config/catalog";
import { useSaved } from "@/components/saved/saved-state";
import { PropertyCard, PropertyCardSkeleton } from "@/components/property/property-card";
import type { PublicListing } from "@/types/domain";
import { isRecord } from "@/lib/utils";

export function SavedExplorer({ initial }: { initial: PublicListing[] }) {
  const { ids, ready } = useSaved();
  const { status } = useSession();
  const [listings, setListings] = useState(initial);
  const [loading, setLoading] = useState(initial.length === 0);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!ready || status === "loading") return;
    if (ids.length === 0) {
      setListings([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    void fetch(`/api/listings/summaries?ids=${ids.join(",")}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: unknown) => {
        if (!isRecord(payload) || !Array.isArray(payload.listings)) {
          setListings([]);
          return;
        }
        setListings(payload.listings.filter(isListing));
      })
      .catch(() => {
        if (!controller.signal.aborted) setListings([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [ids, ready, status]);

  const compared = listings.filter((listing) => selected.includes(listing.id)).slice(0, 3);

  function toggleCompare(id: string) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  }

  if (!ready || loading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading saved homes">
        <PropertyCardSkeleton />
        <PropertyCardSkeleton />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
        <h2 className="font-heading text-2xl">No saved homes yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Tap the heart on a verified home. Saved homes stay on this device, and sync after you sign in.</p>
        <Link href="/search" className="mt-4 inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline">
          Browse verified homes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing) => (
          <li key={listing.id} className="space-y-2">
            <PropertyCard listing={listing} />
            <label className="relative z-20 flex min-h-11 items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={selected.includes(listing.id)}
                onChange={() => toggleCompare(listing.id)}
                disabled={!selected.includes(listing.id) && selected.length >= 3}
              />
              Compare
            </label>
          </li>
        ))}
      </ul>
      {compared.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="px-4 py-4 text-left font-heading text-2xl">Compare up to three homes</caption>
            <thead>
              <tr>
                <th scope="col" className="px-4 py-3">Detail</th>
                {compared.map((listing) => (
                  <th scope="col" key={listing.id} className="px-4 py-3">{listing.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Price", (listing: PublicListing) => formatPriceINR(listing.price)],
                ["Area", (listing: PublicListing) => formatArea(listing.areaSqFt)],
                ["Price / sq ft", (listing: PublicListing) => formatPerSqFt(listing.pricePerSqFt)],
                ["Locality", (listing: PublicListing) => listing.locality.name],
                ["Authority", (listing: PublicListing) => listing.approvingAuthority || "Not stated"],
                ["Possession", (listing: PublicListing) => possessionLabel(listing.possessionStatus)],
                ["Furnishing", (listing: PublicListing) => furnishingLabel(listing.furnishing)],
                ["Facing", (listing: PublicListing) => listing.facing || "Not stated"],
              ].map(([label, render]) => (
                <tr key={String(label)} className="border-t border-border">
                  <th scope="row" className="px-4 py-3 font-medium">{label as string}</th>
                  {compared.map((listing) => (
                    <td key={listing.id} className="px-4 py-3">{(render as (item: PublicListing) => string)(listing)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function isListing(value: unknown): value is PublicListing {
  return isRecord(value) && typeof value.id === "string" && typeof value.slug === "string" && typeof value.title === "string";
}
