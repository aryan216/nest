export const PROPERTY_TYPES = [
  "FLAT",
  "PLOT",
  "ROW_HOUSE",
  "VILLA",
  "STUDIO",
  "INDEPENDENT_HOUSE",
  "COMMERCIAL",
  "FARM_LAND",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const LISTING_STATUSES = [
  "DRAFT",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "SOLD",
  "REJECTED",
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const USER_ROLES = ["BUYER", "PARTNER", "INSPECTOR", "ADMIN"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ENQUIRY_STATUSES = ["NEW", "CONTACTED", "VISIT_SCHEDULED", "CLOSED"] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const POSSESSION_STATUSES = ["READY_TO_MOVE", "UNDER_CONSTRUCTION"] as const;

export type PossessionStatus = (typeof POSSESSION_STATUSES)[number];

export const FURNISHING_OPTIONS = ["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"] as const;

export type Furnishing = (typeof FURNISHING_OPTIONS)[number];

export const PARTNER_APPLICATION_STATUSES = ["NEW", "REVIEWING", "APPROVED", "DECLINED"] as const;

export type PartnerApplicationStatus = (typeof PARTNER_APPLICATION_STATUSES)[number];

export const PREFERRED_TIMES = ["Morning", "Afternoon", "Evening", "Anytime"] as const;

export type PreferredTime = (typeof PREFERRED_TIMES)[number];

export const SORT_OPTIONS = ["newest", "price_asc", "price_desc", "ppsf_asc", "ppsf_desc"] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

export interface ListingImage {
  url: string;
  alt: string;
  order: number;
}

export interface PublicListing {
  id: string;
  slug: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  bhk: number | null;
  areaSqFt: number;
  price: number;
  pricePerSqFt: number;
  locality: { name: string; slug: string };
  city: { name: string; slug: string };
  address: string;
  lat: number;
  lng: number;
  approvingAuthority: string;
  possessionStatus: PossessionStatus;
  furnishing: Furnishing;
  floor: number | null;
  totalFloors: number | null;
  facing: string;
  ageYears: number | null;
  amenities: string[];
  verifiedAt: string;
  images: ListingImage[];
}

export interface StaffDocument {
  name: string;
  url: string;
  kind: string;
}

export interface StaffListing extends PublicListing {
  status: ListingStatus;
  partnerId: string | null;
  rejectionReason: string;
  documents: StaffDocument[];
  createdAt: string;
}

export interface EnquiryRecord {
  id: string;
  listingId: string;
  listingTitle: string;
  name: string;
  phone: string;
  message: string;
  preferredTime: PreferredTime;
  status: EnquiryStatus;
  notes: string;
  createdAt: string;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.some((item) => item === value);
}
