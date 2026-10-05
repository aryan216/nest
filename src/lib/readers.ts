import {
  FURNISHING_OPTIONS,
  LISTING_STATUSES,
  POSSESSION_STATUSES,
  PROPERTY_TYPES,
  isOneOf,
  type Furnishing,
  type ListingStatus,
  type PossessionStatus,
  type PropertyType,
} from "@/types/domain";
import { isRecord, readId, readIso, readNumber, readString, readStringArray } from "@/lib/utils";

export interface RawCity {
  id: string;
  name: string;
  slug: string;
  state: string;
  isLive: boolean;
  lat: number;
  lng: number;
}

export interface RawLocality {
  id: string;
  name: string;
  slug: string;
  cityId: string;
  lat: number;
  lng: number;
}

export interface RawImage {
  listingId: string;
  url: string;
  order: number;
  alt: string;
  contentHash: string;
}

export interface RawDocument {
  name: string;
  url: string;
  kind: string;
}

export interface RawListing {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  bhk: number | null;
  areaSqFt: number;
  price: number;
  pricePerSqFt: number;
  cityId: string;
  localityId: string;
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
  status: ListingStatus;
  verifiedAt: string | null;
  verifiedById: string | null;
  partnerId: string | null;
  rejectionReason: string;
  documents: RawDocument[];
  createdAt: string;
  updatedAt: string;
}

export function readCity(value: unknown): RawCity | null {
  if (!isRecord(value)) return null;
  const id = readId(value._id);
  const lat = readNumber(value.lat);
  const lng = readNumber(value.lng);
  if (!id || lat === null || lng === null) return null;
  const name = readString(value.name);
  const slug = readString(value.slug);
  if (!name || !slug) return null;
  return {
    id,
    name,
    slug,
    state: readString(value.state),
    isLive: value.isLive === true,
    lat,
    lng,
  };
}

export function readLocality(value: unknown): RawLocality | null {
  if (!isRecord(value)) return null;
  const id = readId(value._id);
  const cityId = readId(value.cityId);
  const lat = readNumber(value.lat);
  const lng = readNumber(value.lng);
  const name = readString(value.name);
  const slug = readString(value.slug);
  if (!id || !cityId || lat === null || lng === null || !name || !slug) return null;
  return { id, name, slug, cityId, lat, lng };
}

export function readImage(value: unknown): RawImage | null {
  if (!isRecord(value)) return null;
  const listingId = readId(value.listingId);
  const url = readString(value.url);
  const alt = readString(value.alt);
  const order = readNumber(value.order);
  const contentHash = readString(value.contentHash);
  if (!listingId || !url || order === null) return null;
  return { listingId, url, alt: alt || "Property photo", order, contentHash };
}

export function readListing(value: unknown): RawListing | null {
  if (!isRecord(value)) return null;
  const id = readId(value._id);
  const propertyType = value.propertyType;
  const possessionStatus = value.possessionStatus;
  const furnishing = value.furnishing;
  const status = value.status;
  const areaSqFt = readNumber(value.areaSqFt);
  const price = readNumber(value.price);
  const pricePerSqFt = readNumber(value.pricePerSqFt);
  const lat = readNumber(value.lat);
  const lng = readNumber(value.lng);
  const createdAt = readIso(value.createdAt);
  if (!id || !isOneOf(propertyType, PROPERTY_TYPES)) return null;
  if (!isOneOf(possessionStatus, POSSESSION_STATUSES) || !isOneOf(furnishing, FURNISHING_OPTIONS)) return null;
  if (!isOneOf(status, LISTING_STATUSES)) return null;
  if (areaSqFt === null || price === null || pricePerSqFt === null || lat === null || lng === null || !createdAt) return null;
  const cityId = readId(value.cityId);
  const localityId = readId(value.localityId);
  const publicId = readString(value.publicId);
  const slug = readString(value.slug);
  const title = readString(value.title);
  if (!cityId || !localityId || !publicId || !slug || !title) return null;
  const bhk = readNumber(value.bhk);
  return {
    id,
    publicId,
    slug,
    title,
    description: readString(value.description),
    propertyType,
    bhk,
    areaSqFt,
    price,
    pricePerSqFt,
    cityId,
    localityId,
    address: readString(value.address),
    lat,
    lng,
    approvingAuthority: readString(value.approvingAuthority),
    possessionStatus,
    furnishing,
    floor: readNumber(value.floor),
    totalFloors: readNumber(value.totalFloors),
    facing: readString(value.facing),
    ageYears: readNumber(value.ageYears),
    amenities: readStringArray(value.amenities),
    status,
    verifiedAt: readIso(value.verifiedAt),
    verifiedById: readId(value.verifiedById) || null,
    partnerId: readId(value.partnerId) || null,
    rejectionReason: readString(value.rejectionReason),
    documents: readDocuments(value.documents),
    createdAt,
    updatedAt: readIso(value.updatedAt) ?? createdAt,
  };
}

function readDocuments(value: unknown): RawDocument[] {
  if (!Array.isArray(value)) return [];
  const documents: RawDocument[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const name = readString(item.name);
    const url = readString(item.url);
    const kind = readString(item.kind, "document");
    if (name && url) documents.push({ name, url, kind });
  }
  return documents;
}

export function readChecklist(value: unknown): {
  photosMatch: boolean;
  addressConfirmed: boolean;
  areaMeasured: boolean;
  ownershipDocsSeen: boolean;
  authorityApprovalChecked: boolean;
} | null {
  if (!isRecord(value)) return null;
  return {
    photosMatch: value.photosMatch === true,
    addressConfirmed: value.addressConfirmed === true,
    areaMeasured: value.areaMeasured === true,
    ownershipDocsSeen: value.ownershipDocsSeen === true,
    authorityApprovalChecked: value.authorityApprovalChecked === true,
  };
}
