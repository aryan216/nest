import { brand } from "@/config/brand";
import {
  FURNISHING_OPTIONS,
  POSSESSION_STATUSES,
  PROPERTY_TYPES,
  type Furnishing,
  type PossessionStatus,
  type PropertyType,
} from "@/types/domain";

export interface PropertyMeta {
  type: PropertyType;
  label: string;
  plural: string;
  slug: string;
}

export const PROPERTY_CATALOG: readonly PropertyMeta[] = [
  { type: "FLAT", label: "Flat", plural: "Flats", slug: "flats" },
  { type: "PLOT", label: "Plot", plural: "Plots", slug: "plots" },
  { type: "ROW_HOUSE", label: "Row house", plural: "Row houses", slug: "row-houses" },
  { type: "VILLA", label: "Villa", plural: "Villas", slug: "villas" },
  { type: "STUDIO", label: "Studio", plural: "Studios", slug: "studios" },
  { type: "INDEPENDENT_HOUSE", label: "Independent house", plural: "Independent houses", slug: "independent-houses" },
  { type: "COMMERCIAL", label: "Commercial", plural: "Commercial spaces", slug: "commercial" },
  { type: "FARM_LAND", label: "Farm land", plural: "Farm land", slug: "farm-land" },
];

export const ROTATING_WORDS = ["Flat", "Plot", "Studio", "Row house"] as const;

export const AMENITIES = [
  "Reserved parking",
  "Lift",
  "Power backup",
  "Park facing",
  "Gated street",
  "Piped water",
  "Modular kitchen",
  "Balcony",
  "Servant room",
  "Study",
  "CCTV",
  "Visitor parking",
] as const;

export const APPROVING_AUTHORITIES = ["LDA", "RERA", "Nagar Nigam", "Awas Vikas"] as const;

export const FACING_OPTIONS = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"] as const;

export const BUDGET_PRESETS = [
  { id: "any", label: "Any budget", min: "", max: "" },
  { id: "under-30", label: "Under ₹30 L", min: "0", max: "3000000" },
  { id: "30-50", label: "₹30–50 L", min: "3000000", max: "5000000" },
  { id: "50-80", label: "₹50–80 L", min: "5000000", max: "8000000" },
  { id: "80-120", label: "₹80 L–1.2 Cr", min: "8000000", max: "12000000" },
  { id: "above-120", label: "Above ₹1.2 Cr", min: "12000000", max: "" },
] as const;

export const PAGE_SIZE = 12;

export function propertyMeta(type: PropertyType): PropertyMeta {
  const meta = PROPERTY_CATALOG.find((item) => item.type === type);
  if (!meta) {
    throw new Error(`Unknown property type: ${type}`);
  }
  return meta;
}

export function propertyLabel(type: PropertyType): string {
  return propertyMeta(type).label;
}

export function categoryPath(type: PropertyType, citySlug: string = brand.citySlug): string {
  return `/${propertyMeta(type).slug}-in-${citySlug}`;
}

export function parseSeoSlug(seoSlug: string): { type: PropertyType; citySlug: string } | null {
  const match = /^([a-z0-9-]+)-in-([a-z0-9-]+)$/.exec(seoSlug);
  if (!match) return null;
  const slug = match[1];
  const citySlug = match[2];
  if (!slug || !citySlug) return null;
  const meta = PROPERTY_CATALOG.find((item) => item.slug === slug);
  if (!meta) return null;
  if (!(PROPERTY_TYPES as readonly string[]).includes(meta.type)) return null;
  return { type: meta.type, citySlug };
}

export function possessionLabel(status: PossessionStatus): string {
  if (status === "READY_TO_MOVE") return "Ready to move";
  return "Under construction";
}

export function furnishingLabel(value: Furnishing): string {
  if (value === "FULLY_FURNISHED") return "Fully furnished";
  if (value === "SEMI_FURNISHED") return "Semi furnished";
  return "Unfurnished";
}

export function listingStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function typesThatUseBhk(type: PropertyType): boolean {
  return type === "FLAT" || type === "ROW_HOUSE" || type === "VILLA" || type === "INDEPENDENT_HOUSE" || type === "STUDIO";
}

export const POSSESSION_LABELS = POSSESSION_STATUSES.map((status) => ({
  value: status,
  label: possessionLabel(status),
}));

export const FURNISHING_LABELS = FURNISHING_OPTIONS.map((value) => ({
  value,
  label: furnishingLabel(value),
}));
