"use client";

import dynamic from "next/dynamic";
import type { PublicListing } from "@/types/domain";

const SearchMap = dynamic(() => import("@/components/search/search-map").then((mod) => mod.SearchMap), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse rounded-3xl bg-muted md:h-[560px]" />,
});

export function SearchMapLoader({ listings }: { listings: PublicListing[] }) {
  return <SearchMap listings={listings} />;
}
