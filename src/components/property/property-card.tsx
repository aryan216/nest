"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { propertyMeta } from "@/config/catalog";
import { ListingPhoto } from "@/components/property/listing-photo";
import { useSaved } from "@/components/saved/saved-state";
import { formatArea, formatPerSqFt, formatPriceINR } from "@/lib/format";
import type { PublicListing } from "@/types/domain";
import { cn } from "@/lib/utils";

export function PropertyCard({ listing, priority = false }: { listing: PublicListing; priority?: boolean }) {
  const photos = listing.images.slice(0, 4);
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const swiped = useRef(false);
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(listing.id);
  const photo = photos[index] ?? photos[0];
  const meta = propertyMeta(listing.propertyType);

  const step = (direction: number) => {
    if (photos.length < 2) return;
    setIndex((current) => (current + direction + photos.length) % photos.length);
  };

  return (
    <article
      className="card-lift group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
      onClickCapture={(event) => {
        if (!swiped.current) return;
        event.preventDefault();
        event.stopPropagation();
        swiped.current = false;
      }}
      onTouchStart={(event) => {
        if (event.target instanceof Element && event.target.closest("button")) return;
        touchX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchX.current;
        const end = event.changedTouches[0]?.clientX;
        touchX.current = null;
        if (start === null || end === undefined) return;
        const delta = end - start;
        if (Math.abs(delta) < 40) return;
        swiped.current = true;
        step(delta > 0 ? -1 : 1);
      }}
    >
      <div className="relative aspect-[4/3] bg-muted">
        {photo ? (
          <ListingPhoto src={photo.url} alt={photo.alt} priority={priority} sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" />
        ) : (
          <div className="absolute inset-0 bg-secondary" role="img" aria-label={`${listing.title} photo unavailable`} />
        )}
        <span className="pointer-events-none absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-verified px-2.5 py-1 text-xs font-semibold text-verified-foreground">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
          Verified
        </span>
        {photos.length > 1 ? (
          <div className="absolute inset-x-3 top-1/2 z-30 flex -translate-y-1/2 justify-between md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card/95 shadow-soft" aria-label="Previous photo" onClick={() => step(-1)}>
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card/95 shadow-soft" aria-label="Next photo" onClick={() => step(1)}>
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="pr-12 text-sm font-medium text-muted-foreground">{listing.locality.name}</p>
        <h3 className="font-heading text-xl leading-tight">
          <Link href={`/property/${listing.slug}`} className="rounded-sm">
            {listing.title}
            <span className="absolute inset-0 z-10" aria-hidden="true" />
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">{meta.label}</p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
          <div>
            <p className="font-heading text-2xl tabular-nums">{formatPriceINR(listing.price)}</p>
            <p className="text-sm text-muted-foreground">
              {formatArea(listing.areaSqFt)} · {formatPerSqFt(listing.pricePerSqFt)}
            </p>
          </div>
          {listing.approvingAuthority ? (
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">{listing.approvingAuthority}</span>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        className="absolute right-3 top-3 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full bg-card/95 shadow-soft"
        aria-pressed={saved}
        aria-label={saved ? `Remove ${listing.title} from saved` : `Save ${listing.title}`}
        onClick={() => toggle(listing.id)}
      >
        <Heart className={cn("h-5 w-5", saved ? "fill-primary text-primary" : "")} aria-hidden />
      </button>
    </article>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card" aria-hidden>
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-8 w-28 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
