import { PropertyCardSkeleton } from "@/components/property/property-card";

export default function Loading() {
  return (
    <div className="mx-auto grid max-w-page grid-cols-1 gap-5 px-4 py-10 sm:px-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <PropertyCardSkeleton key={index} />
      ))}
    </div>
  );
}
