import { Types } from "mongoose";
import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/db";
import { buildListingSlug, buildListingTitle, computePricePerSqFt } from "@/lib/listing-identity";
import { ListingImageModel, ListingModel, LocalityModel, VerificationReportModel } from "@/models";
import { readChecklist, readListing, type RawListing } from "@/lib/readers";
import { isRecord, readIso, readString } from "@/lib/utils";
import type { ListingStatus } from "@/types/domain";
import type { VerificationChecklist } from "@/models";

export interface PublicVerification {
  verifiedAt: string;
  notes: string;
  checklist: VerificationChecklist;
}

export async function getPublicVerification(listingId: string): Promise<PublicVerification | null> {
  await connectDB();
  const doc: unknown = await VerificationReportModel().findOne({ listingId }).lean();
  if (!isRecord(doc)) return null;
  const checklist = readChecklist(doc.checklist);
  const verifiedAt = readIso(doc.verifiedAt);
  if (!checklist || !verifiedAt) return null;
  return { verifiedAt, notes: readString(doc.notes), checklist };
}

export async function getStaffListing(id: string): Promise<(RawListing & { localityName: string; images: { url: string; alt: string; order: number }[] }) | null> {
  await connectDB();
  const doc: unknown = await ListingModel().findById(id).lean();
  const listing = readListing(doc);
  if (!listing) return null;
  const locality = await LocalityModel().findById(listing.localityId).lean();
  const localityName = isRecord(locality) ? readString(locality.name) : "";
  const imageDocs: unknown[] = await ListingImageModel().find({ listingId: listing.id }).sort({ order: 1 }).lean();
  const images = imageDocs.flatMap((image) => {
    if (!isRecord(image)) return [];
    const url = readString(image.url);
    if (!url) return [];
    return [{ url, alt: readString(image.alt, listing.title), order: typeof image.order === "number" ? image.order : 0 }];
  });
  return { ...listing, localityName, images };
}

export async function listReviewQueue(): Promise<Array<RawListing & { localityName: string; imageCount: number }>> {
  await connectDB();
  const docs: unknown[] = await ListingModel().find({ status: "PENDING_VERIFICATION" }).sort({ createdAt: 1 }).lean();
  const listings = docs.map((doc) => readListing(doc)).filter((item): item is RawListing => item !== null);
  const localityDocs: unknown[] = await LocalityModel().find({ _id: { $in: listings.map((item) => item.localityId) } }).lean();
  const names = new Map<string, string>();
  for (const doc of localityDocs) {
    if (!isRecord(doc)) continue;
    names.set(String(doc._id), readString(doc.name));
  }
  const counts = new Map<string, number>();
  const imageDocs: unknown[] = await ListingImageModel().find({ listingId: { $in: listings.map((item) => item.id) } }).select("listingId").lean();
  for (const image of imageDocs) {
    if (!isRecord(image)) continue;
    const id = String(image.listingId);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return listings.map((listing) => ({
    ...listing,
    localityName: names.get(listing.localityId) ?? "",
    imageCount: counts.get(listing.id) ?? 0,
  }));
}

export async function approveListing(input: {
  listingId: string;
  inspectorId: string;
  checklist: VerificationChecklist;
  notes: string;
  inspectionPhotos: string[];
}): Promise<void> {
  const passed = Object.values(input.checklist).every(Boolean);
  if (!passed) throw new Error("Every checklist item must pass before a listing can go live.");
  await connectDB();
  const listing = await ListingModel().findById(input.listingId);
  if (!listing) throw new Error("Listing not found.");
  const locality = await LocalityModel().findById(listing.localityId);
  if (!locality) throw new Error("Locality not found.");
  const identity = {
    propertyType: listing.propertyType,
    bhk: listing.bhk,
    localityName: locality.name,
  };
  listing.title = buildListingTitle(identity);
  listing.slug = buildListingSlug({ ...identity, publicId: listing.publicId });
  listing.pricePerSqFt = computePricePerSqFt(listing.price, listing.areaSqFt);
  listing.status = "VERIFIED";
  listing.verifiedAt = new Date();
  listing.verifiedById = new Types.ObjectId(input.inspectorId);
  listing.rejectionReason = "";
  await listing.save();
  await VerificationReportModel().findOneAndUpdate(
    { listingId: listing._id },
    {
      listingId: listing._id,
      inspectorId: new Types.ObjectId(input.inspectorId),
      checklist: input.checklist,
      notes: input.notes,
      inspectionPhotos: input.inspectionPhotos,
      verifiedAt: listing.verifiedAt,
    },
    { upsert: true },
  );
  revalidateTag("listings");
}

export async function rejectListing(listingId: string, reason: string): Promise<void> {
  await connectDB();
  await ListingModel().updateOne({ _id: listingId }, { status: "REJECTED" satisfies ListingStatus, rejectionReason: reason, verifiedAt: null });
  revalidateTag("listings");
}

export async function listLiveLocalities(): Promise<Array<{ id: string; name: string; slug: string; lat: number; lng: number }>> {
  await connectDB();
  const { brand } = await import("@/config/brand");
  const { CityModel } = await import("@/models");
  const { readCity, readLocality } = await import("@/lib/readers");
  const cityDoc: unknown = await CityModel().findOne({ slug: brand.citySlug, isLive: true }).lean();
  const city = readCity(cityDoc);
  if (!city) return [];
  const docs: unknown[] = await LocalityModel().find({ cityId: city.id }).sort({ name: 1 }).lean();
  return docs.flatMap((doc) => {
    const locality = readLocality(doc);
    if (!locality) return [];
    return [{ id: locality.id, name: locality.name, slug: locality.slug, lat: locality.lat, lng: locality.lng }];
  });
}
