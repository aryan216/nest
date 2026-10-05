import { randomBytes } from "crypto";
import { propertyLabel } from "@/config/catalog";
import type { PropertyType } from "@/types/domain";

export interface ListingIdentityInput {
  propertyType: PropertyType;
  bhk: number | null;
  localityName: string;
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildListingTitle(input: ListingIdentityInput): string {
  const label = propertyLabel(input.propertyType);
  const skipBhk =
    input.propertyType === "PLOT" ||
    input.propertyType === "FARM_LAND" ||
    input.propertyType === "COMMERCIAL" ||
    input.propertyType === "STUDIO";
  if (input.bhk && input.bhk > 0 && !skipBhk) {
    return `${input.bhk} BHK ${label} in ${input.localityName}`;
  }
  return `${label} in ${input.localityName}`;
}

export function buildListingSlug(input: ListingIdentityInput & { publicId: string }): string {
  return `${slugify(buildListingTitle(input))}-${input.publicId.toLowerCase()}`;
}

export function computePricePerSqFt(price: number, areaSqFt: number): number {
  if (!Number.isFinite(price) || !Number.isFinite(areaSqFt) || areaSqFt <= 0) return 0;
  return Math.round(price / areaSqFt);
}

export function createPublicId(): string {
  return randomBytes(4).toString("hex").slice(0, 8);
}

export function titlesMatchSource(
  stored: { title: string; slug: string; publicId: string },
  source: ListingIdentityInput,
): boolean {
  const title = buildListingTitle(source);
  const slug = buildListingSlug({ ...source, publicId: stored.publicId });
  return stored.title === title && stored.slug === slug;
}
