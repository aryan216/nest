import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { ListingImageModel, ListingModel, LocalityModel, SavedListingModel } from "@/models";
import { readListing, type RawListing } from "@/lib/readers";
import { duplicateImageWarnings, inspectListing, type QualityWarning } from "@/lib/quality";
import { isRecord, readString } from "@/lib/utils";
import type { PublicListing } from "@/types/domain";

export async function listSavedIds(userId: string): Promise<string[]> {
  await connectDB();
  const docs: unknown[] = await SavedListingModel().find({ userId }).select("listingId").lean();
  return docs.flatMap((doc) => {
    if (!isRecord(doc)) return [];
    const id = String(doc.listingId);
    return /^[a-f0-9]{24}$/i.test(id) ? [id] : [];
  });
}

export async function setSaved(userId: string, listingId: string, saved: boolean): Promise<void> {
  await connectDB();
  if (!saved) {
    await SavedListingModel().deleteOne({ userId, listingId });
    return;
  }
  const listing = await ListingModel().findOne({ _id: listingId, status: "VERIFIED" }).select("_id");
  if (!listing) return;
  await SavedListingModel().updateOne(
    { userId: new Types.ObjectId(userId), listingId: new Types.ObjectId(listingId) },
    { $setOnInsert: { userId: new Types.ObjectId(userId), listingId: new Types.ObjectId(listingId) } },
    { upsert: true },
  );
}

export async function syncSaved(userId: string, ids: string[]): Promise<string[]> {
  for (const id of ids.slice(0, 50)) {
    await setSaved(userId, id, true);
  }
  return listSavedIds(userId);
}

export async function listSavedListings(userId: string): Promise<PublicListing[]> {
  const ids = await listSavedIds(userId);
  const { getListingsByIds } = await import("@/services/listings");
  return getListingsByIds(ids);
}

export async function getQualityReport(): Promise<QualityWarning[]> {
  await connectDB();
  const docs: unknown[] = await ListingModel().find().lean();
  const listings = docs.map((doc) => readListing(doc)).filter((item): item is RawListing => item !== null);
  const localityDocs: unknown[] = await LocalityModel().find({ _id: { $in: listings.map((item) => item.localityId) } }).lean();
  const localities = new Map<string, { name: string; lat: number; lng: number; cityId: string }>();
  for (const doc of localityDocs) {
    if (!isRecord(doc)) continue;
    const id = String(doc._id);
    if (!/^[a-f0-9]{24}$/i.test(id)) continue;
    localities.set(id, {
      name: readString(doc.name),
      lat: typeof doc.lat === "number" ? doc.lat : 0,
      lng: typeof doc.lng === "number" ? doc.lng : 0,
      cityId: String(doc.cityId),
    });
  }
  const { CityModel } = await import("@/models");
  const cityDocs: unknown[] = await CityModel().find().lean();
  const cityCenters = new Map<string, { lat: number; lng: number }>();
  for (const doc of cityDocs) {
    if (!isRecord(doc)) continue;
    if (typeof doc.lat === "number" && typeof doc.lng === "number") cityCenters.set(String(doc._id), { lat: doc.lat, lng: doc.lng });
  }
  const imageDocs: unknown[] = await ListingImageModel().find().lean();
  const imagesByListing = new Map<string, { url: string; hash: string }[]>();
  const hashGroups = new Map<string, { url: string; listingIds: Set<string> }>();
  for (const image of imageDocs) {
    if (!isRecord(image)) continue;
    const listingId = String(image.listingId);
    const url = readString(image.url);
    const hash = readString(image.contentHash) || url;
    if (!listingId || !url) continue;
    const group = imagesByListing.get(listingId) ?? [];
    group.push({ url, hash });
    imagesByListing.set(listingId, group);
    const existing = hashGroups.get(hash) ?? { url, listingIds: new Set<string>() };
    existing.listingIds.add(listingId);
    hashGroups.set(hash, existing);
  }
  const titles = new Map(listings.map((listing) => [listing.id, listing.title]));
  const warnings: QualityWarning[] = [];
  for (const listing of listings) {
    const locality = localities.get(listing.localityId);
    warnings.push(
      ...inspectListing({
        id: listing.id,
        title: listing.title,
        slug: listing.slug,
        publicId: listing.publicId,
        propertyType: listing.propertyType,
        bhk: listing.bhk,
        localityName: locality?.name ?? "",
        areaSqFt: listing.areaSqFt,
        pricePerSqFt: listing.pricePerSqFt,
        floor: listing.floor,
        totalFloors: listing.totalFloors,
        lat: listing.lat,
        lng: listing.lng,
        description: listing.description,
        approvingAuthority: listing.approvingAuthority,
        address: listing.address,
        imageCount: imagesByListing.get(listing.id)?.length ?? 0,
        documentCount: listing.documents.length,
        cityCenter: locality ? cityCenters.get(locality.cityId) ?? null : null,
      }),
    );
  }
  warnings.push(
    ...duplicateImageWarnings(
      [...hashGroups.entries()].map(([contentHash, group]) => ({
        contentHash,
        url: group.url,
        listingIds: [...group.listingIds],
      })),
      titles,
    ),
  );
  return warnings;
}

export type { PublicListing };