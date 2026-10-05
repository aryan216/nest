import { cache } from "react";
import { unstable_cache } from "next/cache";
import { Types } from "mongoose";
import { brand } from "@/config/brand";
import { PAGE_SIZE, PROPERTY_CATALOG } from "@/config/catalog";
import { connectDB } from "@/lib/db";
import { CityModel, ListingImageModel, ListingModel, LocalityModel, TestimonialModel } from "@/models";
import { isRecord } from "@/lib/utils";
import { readCity, readImage, readListing, readLocality, type RawCity, type RawImage, type RawListing, type RawLocality } from "@/lib/readers";
import type { Paged, PossessionStatus, PropertyType, PublicListing, SortOption } from "@/types/domain";
import type { SearchQuery } from "@/validations/schemas";

export interface MarketLocality {
  name: string;
  slug: string;
  count: number;
  averagePricePerSqFt: number;
}

export interface MarketTestimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  isSample: boolean;
}

export interface PublicMarket {
  ready: boolean;
  verifiedCount: number;
  localityCount: number;
  inspectionCount: number;
  typeCounts: { type: PropertyType; count: number }[];
  localities: MarketLocality[];
  authorities: string[];
  fresh: PublicListing[];
  rows: { type: PropertyType; listings: PublicListing[] }[];
  testimonials: MarketTestimonial[];
  comingSoon: string[];
  listings: PublicListing[];
}

export interface PublicVerification {
  verifiedAt: string;
  notes: string;
  checklist: {
    photosMatch: boolean;
    addressConfirmed: boolean;
    areaMeasured: boolean;
    ownershipDocsSeen: boolean;
    authorityApprovalChecked: boolean;
  };
}

const emptyMarket = (): PublicMarket => ({
  ready: false,
  verifiedCount: 0,
  localityCount: 0,
  inspectionCount: 0,
  typeCounts: [],
  localities: [],
  authorities: [],
  fresh: [],
  rows: [],
  testimonials: [],
  comingSoon: brand.comingSoonCities.map((city) => city.name),
  listings: [],
});

function toPublic(listing: RawListing, locality: RawLocality, city: RawCity, images: RawImage[]): PublicListing | null {
  if (listing.status !== "VERIFIED" || !listing.verifiedAt) return null;
  const sorted = images.filter((image) => image.listingId === listing.id).sort((a, b) => a.order - b.order);
  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    description: listing.description,
    propertyType: listing.propertyType,
    bhk: listing.bhk,
    areaSqFt: listing.areaSqFt,
    price: listing.price,
    pricePerSqFt: listing.pricePerSqFt,
    locality: { name: locality.name, slug: locality.slug },
    city: { name: city.name, slug: city.slug },
    address: listing.address,
    lat: listing.lat,
    lng: listing.lng,
    approvingAuthority: listing.approvingAuthority,
    possessionStatus: listing.possessionStatus,
    furnishing: listing.furnishing,
    floor: listing.floor,
    totalFloors: listing.totalFloors,
    facing: listing.facing,
    ageYears: listing.ageYears,
    amenities: listing.amenities,
    verifiedAt: listing.verifiedAt,
    images: sorted.map((image) => ({ url: image.url, alt: image.alt, order: image.order })),
  };
}

async function loadImages(listingIds: string[]): Promise<RawImage[]> {
  if (listingIds.length === 0) return [];
  const docs: unknown[] = await ListingImageModel().find({ listingId: { $in: listingIds } }).sort({ order: 1 }).lean();
  return docs.map((doc) => readImage(doc)).filter((image): image is RawImage => image !== null);
}

async function loadLocalities(ids: string[]): Promise<Map<string, RawLocality>> {
  const map = new Map<string, RawLocality>();
  if (ids.length === 0) return map;
  const docs: unknown[] = await LocalityModel().find({ _id: { $in: ids } }).lean();
  for (const doc of docs) {
    const locality = readLocality(doc);
    if (locality) map.set(locality.id, locality);
  }
  return map;
}

async function loadCities(ids: string[]): Promise<Map<string, RawCity>> {
  const map = new Map<string, RawCity>();
  if (ids.length === 0) return map;
  const docs: unknown[] = await CityModel().find({ _id: { $in: ids } }).lean();
  for (const doc of docs) {
    const city = readCity(doc);
    if (city) map.set(city.id, city);
  }
  return map;
}

export async function hydratePublic(rawListings: RawListing[]): Promise<PublicListing[]> {
  const images = await loadImages(rawListings.map((listing) => listing.id));
  const localities = await loadLocalities(rawListings.map((listing) => listing.localityId));
  const cities = await loadCities(rawListings.map((listing) => listing.cityId));
  const imageGroups = new Map<string, RawImage[]>();
  for (const image of images) {
    const group = imageGroups.get(image.listingId) ?? [];
    group.push(image);
    imageGroups.set(image.listingId, group);
  }
  const publicListings: PublicListing[] = [];
  for (const listing of rawListings) {
    const locality = localities.get(listing.localityId);
    const city = cities.get(listing.cityId);
    if (!locality || !city) continue;
    const item = toPublic(listing, locality, city, imageGroups.get(listing.id) ?? []);
    if (item) publicListings.push(item);
  }
  return publicListings;
}

async function loadPublicMarket(): Promise<PublicMarket> {
  await connectDB();
  const cityDocs: unknown[] = await CityModel().find().lean();
  const cities = cityDocs.map((doc) => readCity(doc)).filter((city): city is RawCity => city !== null);
  const live = cities.find((city) => city.slug === brand.citySlug && city.isLive) ?? null;
  const comingSoon = cities.filter((city) => !city.isLive).map((city) => city.name);
  if (!live) return { ...emptyMarket(), comingSoon: comingSoon.length > 0 ? comingSoon : emptyMarket().comingSoon };

  const listingDocs: unknown[] = await ListingModel()
    .find({ status: "VERIFIED", cityId: live.id })
    .sort({ createdAt: -1 })
    .lean();
  const raw = listingDocs.map((doc) => readListing(doc)).filter((listing): listing is RawListing => listing !== null);
  const listings = await hydratePublic(raw);
  const typeMap = new Map<PropertyType, number>();
  const localityBuckets = new Map<string, { count: number; sum: number }>();
  const authorities = new Set<string>();
  let inspectionCount = 0;
  for (const listing of listings) {
    typeMap.set(listing.propertyType, (typeMap.get(listing.propertyType) ?? 0) + 1);
    const bucket = localityBuckets.get(listing.locality.slug) ?? { count: 0, sum: 0 };
    bucket.count += 1;
    bucket.sum += listing.pricePerSqFt;
    localityBuckets.set(listing.locality.slug, bucket);
    if (listing.approvingAuthority) authorities.add(listing.approvingAuthority);
    if (listing.verifiedAt) inspectionCount += 1;
  }
  const localityName = new Map(listings.map((listing) => [listing.locality.slug, listing.locality.name]));
  const localities: MarketLocality[] = [...localityBuckets.entries()]
    .map(([slug, bucket]) => ({
      name: localityName.get(slug) ?? slug,
      slug,
      count: bucket.count,
      averagePricePerSqFt: bucket.count > 0 ? Math.round(bucket.sum / bucket.count) : 0,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const catalogOrder = new Map(PROPERTY_CATALOG.map((item, index) => [item.type, index]));
  const typeCounts = [...typeMap.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || (catalogOrder.get(a.type) ?? 0) - (catalogOrder.get(b.type) ?? 0));
  const testimonialDocs: unknown[] = await TestimonialModel().find({ published: true }).sort({ order: 1 }).lean();
  const testimonials: MarketTestimonial[] = [];
  for (const doc of testimonialDocs) {
    if (!isRecord(doc)) continue;
    const name = typeof doc.name === "string" ? doc.name : "";
    const role = typeof doc.role === "string" ? doc.role : "";
    const quote = typeof doc.quote === "string" ? doc.quote : "";
    if (!name || !quote) continue;
    testimonials.push({
      id: typeof doc._id === "object" && doc._id !== null ? String(doc._id) : name,
      name,
      role,
      quote,
      isSample: doc.isSample === true,
    });
  }
  return {
    ready: true,
    verifiedCount: listings.length,
    localityCount: localities.length,
    inspectionCount,
    typeCounts,
    localities,
    authorities: [...authorities].sort(),
    fresh: listings.slice(0, 9),
    rows: typeCounts.map((entry) => ({
      type: entry.type,
      listings: listings.filter((listing) => listing.propertyType === entry.type).slice(0, 8),
    })),
    testimonials,
    comingSoon: comingSoon.length > 0 ? comingSoon : emptyMarket().comingSoon,
    listings,
  };
}

const readCachedMarket = unstable_cache(loadPublicMarket, ["public-market-v3", brand.citySlug], {
  revalidate: 300,
  tags: ["listings"],
});

export const getPublicMarket = cache(async (): Promise<PublicMarket> => {
  try {
    if (process.env.NODE_ENV !== "production") return await loadPublicMarket();
    return await readCachedMarket();
  } catch {
    return emptyMarket();
  }
});

interface ListingFilter {
  status: "VERIFIED";
  cityId?: string;
  propertyType?: PropertyType;
  localityId?: string | { $in: Array<string | Types.ObjectId> };
  bhk?: { $in: number[] };
  approvingAuthority?: string;
  possessionStatus?: PossessionStatus;
  price?: { $gte?: number; $lte?: number };
  areaSqFt?: { $gte?: number; $lte?: number };
  _id?: { $ne?: string; $nin?: string[] };
}

function sortSpec(sort: SortOption | undefined): Record<string, 1 | -1> {
  if (sort === "price_asc") return { price: 1 };
  if (sort === "price_desc") return { price: -1 };
  if (sort === "ppsf_asc") return { pricePerSqFt: 1 };
  if (sort === "ppsf_desc") return { pricePerSqFt: -1 };
  return { createdAt: -1 };
}

export async function searchListings(query: SearchQuery): Promise<Paged<PublicListing>> {
  await connectDB();
  const city = await CityModel().findOne({ slug: brand.citySlug, isLive: true }).lean();
  const live = readCity(city);
  if (!live) return { items: [], page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };
  const filter: ListingFilter = { status: "VERIFIED", cityId: live.id };
  if (query.type) filter.propertyType = query.type;
  if (query.locality && query.locality.length > 0) {
    const localityDocs: unknown[] = await LocalityModel().find({ cityId: live.id, slug: { $in: query.locality } }).lean();
    const ids = localityDocs.map((doc) => readLocality(doc)?.id).filter((id): id is string => Boolean(id));
    filter.localityId = { $in: ids.length > 0 ? ids : [new Types.ObjectId()] };
  }
  if (query.bhk && query.bhk.length > 0) filter.bhk = { $in: query.bhk };
  if (query.authority) filter.approvingAuthority = query.authority;
  if (query.possession) filter.possessionStatus = query.possession;
  if (query.budgetMin !== undefined || query.budgetMax !== undefined) {
    filter.price = {};
    if (query.budgetMin !== undefined) filter.price.$gte = query.budgetMin;
    if (query.budgetMax !== undefined) filter.price.$lte = query.budgetMax;
  }
  if (query.areaMin !== undefined || query.areaMax !== undefined) {
    filter.areaSqFt = {};
    if (query.areaMin !== undefined) filter.areaSqFt.$gte = query.areaMin;
    if (query.areaMax !== undefined) filter.areaSqFt.$lte = query.areaMax;
  }
  const page = query.page ?? 1;
  const total = await ListingModel().countDocuments(filter);
  const docs: unknown[] = await ListingModel()
    .find(filter)
    .sort(sortSpec(query.sort))
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();
  const raw = docs.map((doc) => readListing(doc)).filter((listing): listing is RawListing => listing !== null);
  const items = await hydratePublic(raw);
  return {
    items,
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export const getVerifiedListing = cache(async (slug: string): Promise<PublicListing | null> => {
  await connectDB();
  const doc: unknown = await ListingModel().findOne({ slug, status: "VERIFIED" }).lean();
  const raw = readListing(doc);
  if (!raw) return null;
  const [item] = await hydratePublic([raw]);
  return item ?? null;
});

export async function getSimilarListings(listing: PublicListing): Promise<PublicListing[]> {
  await connectDB();
  const localityDocs: unknown[] = await LocalityModel().find({ slug: listing.locality.slug }).lean();
  const locality = localityDocs.map((doc) => readLocality(doc)).find((item) => item !== null);
  const primaryFilter: ListingFilter = {
    status: "VERIFIED",
    _id: { $ne: listing.id },
  };
  if (locality) primaryFilter.localityId = locality.id;
  const primaryDocs: unknown[] = await ListingModel().find(primaryFilter).sort({ createdAt: -1 }).limit(3).lean();
  let raw = primaryDocs.map((doc) => readListing(doc)).filter((item): item is RawListing => item !== null);
  if (raw.length < 3) {
    const moreDocs: unknown[] = await ListingModel()
      .find({
        status: "VERIFIED",
        propertyType: listing.propertyType,
        _id: { $nin: [listing.id, ...raw.map((item) => item.id)] },
      })
      .sort({ createdAt: -1 })
      .limit(3 - raw.length)
      .lean();
    raw = raw.concat(moreDocs.map((doc) => readListing(doc)).filter((item): item is RawListing => item !== null));
  }
  return hydratePublic(raw);
}

export async function getListingsByIds(ids: string[]): Promise<PublicListing[]> {
  const unique = [...new Set(ids)].slice(0, 30).filter((id) => /^[a-f0-9]{24}$/i.test(id));
  if (unique.length === 0) return [];
  await connectDB();
  const docs: unknown[] = await ListingModel().find({ _id: { $in: unique }, status: "VERIFIED" }).lean();
  const raw = docs.map((doc) => readListing(doc)).filter((item): item is RawListing => item !== null);
  const hydrated = await hydratePublic(raw);
  const order = new Map(unique.map((id, index) => [id, index]));
  return hydrated.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
