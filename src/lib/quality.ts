import type { PropertyType } from "@/types/domain";
import { titlesMatchSource } from "@/lib/listing-identity";

export interface QualityWarning {
  code: "BHK_AREA" | "PRICE_BAND" | "DUPLICATE_IMAGE" | "MISSING_FIELD" | "IDENTITY_MISMATCH" | "FLOOR" | "COORDINATES";
  listingId: string;
  listingTitle: string;
  message: string;
}

export interface ListingQualityInput {
  id: string;
  title: string;
  slug: string;
  publicId: string;
  propertyType: PropertyType;
  bhk: number | null;
  localityName: string;
  areaSqFt: number;
  pricePerSqFt: number;
  floor: number | null;
  totalFloors: number | null;
  lat: number;
  lng: number;
  description: string;
  approvingAuthority: string;
  address: string;
  imageCount: number;
  documentCount: number;
  cityCenter: { lat: number; lng: number } | null;
}

const MIN_AREA_FOR_BHK: Record<number, number> = {
  1: 400,
  2: 700,
  3: 950,
  4: 1000,
  5: 1500,
  6: 1800,
};

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function inspectListing(input: ListingQualityInput): QualityWarning[] {
  const warnings: QualityWarning[] = [];
  const push = (code: QualityWarning["code"], message: string) => {
    warnings.push({ code, listingId: input.id, listingTitle: input.title, message });
  };

  if (input.bhk && input.bhk > 0) {
    const minimum = MIN_AREA_FOR_BHK[input.bhk] ?? input.bhk * 350;
    if (input.areaSqFt < minimum) {
      push(
        "BHK_AREA",
        `${input.bhk} BHK is listed at ${input.areaSqFt.toLocaleString("en-IN")} sq ft. That is unusually small (under ${minimum.toLocaleString("en-IN")} sq ft).`,
      );
    }
  }

  const band = priceBand(input.propertyType);
  if (input.pricePerSqFt < band.min || input.pricePerSqFt > band.max) {
    push(
      "PRICE_BAND",
      `₹${input.pricePerSqFt.toLocaleString("en-IN")} per sq ft sits outside the usual ${input.propertyType.toLowerCase().replaceAll("_", " ")} band for this desk.`,
    );
  }

  if (input.floor !== null && input.totalFloors !== null && input.floor > input.totalFloors) {
    push("FLOOR", "The listed floor is higher than the total floors.");
  }

  if (input.cityCenter) {
    const distance = distanceKm({ lat: input.lat, lng: input.lng }, input.cityCenter);
    if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng) || distance > 35) {
      push("COORDINATES", "The map pin is missing or sits more than 35 km from the city centre.");
    }
  }

  if (input.description.trim().length < 40) push("MISSING_FIELD", "Description is missing or too short.");
  if (input.imageCount < 2) push("MISSING_FIELD", "Fewer than two photos are attached.");
  if (!input.approvingAuthority.trim()) push("MISSING_FIELD", "Approving authority is empty.");
  if (input.address.trim().length < 8) push("MISSING_FIELD", "Address is missing.");
  if (input.documentCount < 1) push("MISSING_FIELD", "No ownership or approval document is attached.");

  if (
    !titlesMatchSource(
      { title: input.title, slug: input.slug, publicId: input.publicId },
      { propertyType: input.propertyType, bhk: input.bhk, localityName: input.localityName },
    )
  ) {
    push("IDENTITY_MISMATCH", "Title or URL slug does not match the property type, BHK and locality.");
  }

  return warnings;
}

function priceBand(type: PropertyType): { min: number; max: number } {
  if (type === "FARM_LAND") return { min: 40, max: 4000 };
  if (type === "PLOT") return { min: 800, max: 20000 };
  return { min: 2000, max: 25000 };
}

export interface DuplicateImageGroup {
  contentHash: string;
  url: string;
  listingIds: string[];
}

export function duplicateImageWarnings(
  groups: DuplicateImageGroup[],
  titles: Map<string, string>,
): QualityWarning[] {
  const warnings: QualityWarning[] = [];
  for (const group of groups) {
    if (group.listingIds.length < 2) continue;
    for (const listingId of group.listingIds) {
      warnings.push({
        code: "DUPLICATE_IMAGE",
        listingId,
        listingTitle: titles.get(listingId) ?? "Listing",
        message: `This photo also appears on ${group.listingIds.length - 1} other listing${group.listingIds.length > 2 ? "s" : ""}.`,
      });
    }
  }
  return warnings;
}
