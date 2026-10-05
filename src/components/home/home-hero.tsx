"use client";

import dynamic from "next/dynamic";
import type { PublicMarket } from "@/services/listings";

const OrbitDeliveryHero = dynamic(() => import("@/components/ui/orbit-delivery-hero"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-[#f6f9ff]" role="status" aria-live="polite">
      <p className="text-sm text-[#8197c4]">Your little world is taking shape…</p>
    </div>
  ),
});

export function HomeHero({ market }: { market: PublicMarket }) {
  void market;
  return (
    <section className="orbit-home-hero relative" aria-label="Home hero">
      <OrbitDeliveryHero theme="light" />
    </section>
  );
}
