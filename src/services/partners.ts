import { Types } from "mongoose";
import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/db";
import { buildListingSlug, buildListingTitle, computePricePerSqFt, createPublicId } from "@/lib/listing-identity";
import { EnquiryModel, ListingImageModel, ListingModel, LocalityModel, PartnerApplicationModel, UserModel } from "@/models";
import { readListing, type RawListing } from "@/lib/readers";
import { isRecord, readId, readIso, readString } from "@/lib/utils";
import type { EnquiryInput, ListingFormValues } from "@/validations/schemas";
import type { ListingStatus, PartnerApplicationStatus } from "@/types/domain";
import { isOneOf, PARTNER_APPLICATION_STATUSES, PREFERRED_TIMES, ENQUIRY_STATUSES, type EnquiryRecord, type EnquiryStatus } from "@/types/domain";

export async function createEnquiry(input: EnquiryInput): Promise<void> {
  await connectDB();
  const listing = await ListingModel().findOne({ _id: input.listingId, status: "VERIFIED" }).select("_id");
  if (!listing) throw new Error("That listing is not available.");
  await EnquiryModel().create({
    listingId: listing._id,
    name: input.name,
    phone: input.phone,
    message: input.message,
    preferredTime: input.preferredTime,
    status: "NEW",
    notes: "",
  });
}

export async function listEnquiries(status?: EnquiryStatus): Promise<EnquiryRecord[]> {
  await connectDB();
  const filter = status ? { status } : {};
  const docs: unknown[] = await EnquiryModel().find(filter).sort({ createdAt: -1 }).limit(500).lean();
  const listingIds = docs.map((doc) => (isRecord(doc) ? readId(doc.listingId) : "")).filter(Boolean);
  const listings: unknown[] = await ListingModel().find({ _id: { $in: listingIds } }).select("title").lean();
  const titles = new Map<string, string>();
  for (const listing of listings) {
    if (!isRecord(listing)) continue;
    titles.set(readId(listing._id), readString(listing.title, "Listing"));
  }
  const records: EnquiryRecord[] = [];
  for (const doc of docs) {
    if (!isRecord(doc)) continue;
    const preferred = doc.preferredTime;
    const enquiryStatus = doc.status;
    if (!isOneOf(preferred, PREFERRED_TIMES) || !isOneOf(enquiryStatus, ENQUIRY_STATUSES)) continue;
    const createdAt = readIso(doc.createdAt);
    const id = readId(doc._id);
    if (!id || !createdAt) continue;
    records.push({
      id,
      listingId: readId(doc.listingId),
      listingTitle: titles.get(readId(doc.listingId)) ?? "Listing",
      name: readString(doc.name),
      phone: readString(doc.phone),
      message: readString(doc.message),
      preferredTime: preferred,
      status: enquiryStatus,
      notes: readString(doc.notes),
      createdAt,
    });
  }
  return records;
}

export function enquiriesToCsv(records: EnquiryRecord[]): string {
  const header = ["Created", "Listing", "Name", "Phone", "Preferred time", "Status", "Message", "Notes"];
  const lines = records.map((record) =>
    [record.createdAt, record.listingTitle, record.name, record.phone, record.preferredTime, record.status, record.message, record.notes]
      .map(csvCell)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

export async function updateEnquiry(id: string, status: EnquiryStatus, notes: string): Promise<void> {
  await connectDB();
  await EnquiryModel().updateOne({ _id: id }, { status, notes });
}

export interface PartnerApplicationView {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  experience: string;
  about: string;
  status: PartnerApplicationStatus;
  createdAt: string;
}

export async function createPartnerApplication(input: {
  name: string;
  phone: string;
  email: string;
  city: string;
  experience: string;
  about: string;
}): Promise<void> {
  await connectDB();
  await PartnerApplicationModel().create({ ...input, status: "NEW" });
}

export async function listPartnerApplications(): Promise<PartnerApplicationView[]> {
  await connectDB();
  const docs: unknown[] = await PartnerApplicationModel().find().sort({ createdAt: -1 }).lean();
  const items: PartnerApplicationView[] = [];
  for (const doc of docs) {
    if (!isRecord(doc) || !isOneOf(doc.status, PARTNER_APPLICATION_STATUSES)) continue;
    const createdAt = readIso(doc.createdAt);
    const id = readId(doc._id);
    if (!id || !createdAt) continue;
    items.push({
      id,
      name: readString(doc.name),
      phone: readString(doc.phone),
      email: readString(doc.email),
      city: readString(doc.city),
      experience: readString(doc.experience),
      about: readString(doc.about),
      status: doc.status,
      createdAt,
    });
  }
  return items;
}

export async function decidePartnerApplication(id: string, status: PartnerApplicationStatus): Promise<void> {
  await connectDB();
  const application = await PartnerApplicationModel().findById(id);
  if (!application) return;
  application.status = status;
  await application.save();
  if (status !== "APPROVED") return;
  const existing = await UserModel().findOne({ email: application.email });
  if (!existing) {
    await UserModel().create({
      name: application.name,
      email: application.email,
      phone: application.phone,
      role: "PARTNER",
      image: "",
    });
    return;
  }
  if (existing.role === "BUYER") {
    existing.role = "PARTNER";
    if (!existing.phone) existing.phone = application.phone;
    await existing.save();
  }
}

export interface PartnerListingSummary {
  id: string;
  title: string;
  slug: string;
  status: ListingStatus;
  rejectionReason: string;
  price: number;
  localityName: string;
  createdAt: string;
}

export async function listPartnerListings(partnerId: string): Promise<PartnerListingSummary[]> {
  await connectDB();
  const docs: unknown[] = await ListingModel().find({ partnerId }).sort({ createdAt: -1 }).lean();
  const raw = docs.map((doc) => readListing(doc)).filter((item): item is RawListing => item !== null);
  const localityIds = raw.map((item) => item.localityId);
  const localityDocs: unknown[] = await LocalityModel().find({ _id: { $in: localityIds } }).select("name").lean();
  const names = new Map<string, string>();
  for (const doc of localityDocs) {
    if (!isRecord(doc)) continue;
    names.set(readId(doc._id), readString(doc.name));
  }
  return raw.map((listing) => ({
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    status: listing.status,
    rejectionReason: listing.rejectionReason,
    price: listing.price,
    localityName: names.get(listing.localityId) ?? "",
    createdAt: listing.createdAt,
  }));
}

export async function createPartnerListing(input: {
  partnerId: string;
  values: ListingFormValues;
  images: { url: string; alt: string; contentHash: string }[];
  documents: { name: string; url: string; kind: string }[];
}): Promise<string> {
  await connectDB();
  const locality = await LocalityModel().findById(input.values.localityId);
  if (!locality) throw new Error("Choose a locality in the live city.");
  const cityId = String(locality.cityId);
  const identity = {
    propertyType: input.values.propertyType,
    bhk: input.values.propertyType === "STUDIO" || input.values.propertyType === "PLOT" || input.values.propertyType === "COMMERCIAL" || input.values.propertyType === "FARM_LAND" ? null : input.values.bhk,
    localityName: locality.name,
  };
  const publicId = createPublicId();
  const autoTitle = buildListingTitle(identity);
  const title = input.values.title.trim() || autoTitle;
  const address = input.values.landmark.trim()
    ? `${input.values.address.trim()} (Near ${input.values.landmark.trim()})`
    : input.values.address.trim();
  const slug = buildListingSlug({ ...identity, publicId });
  const created = await ListingModel().create({
    publicId,
    slug,
    title,
    description: input.values.description,
    propertyType: identity.propertyType,
    bhk: identity.bhk,
    areaSqFt: input.values.areaSqFt,
    price: input.values.price,
    pricePerSqFt: computePricePerSqFt(input.values.price, input.values.areaSqFt),
    cityId: new Types.ObjectId(cityId),
    localityId: locality._id,
    address,
    lat: input.values.lat,
    lng: input.values.lng,
    approvingAuthority: input.values.approvingAuthority,
    possessionStatus: input.values.possessionStatus,
    furnishing: input.values.furnishing,
    floor: input.values.floor,
    totalFloors: input.values.totalFloors,
    facing: input.values.facing,
    ageYears: input.values.ageYears,
    amenities: input.values.amenities,
    status: "PENDING_VERIFICATION",
    verifiedAt: null,
    verifiedById: null,
    partnerId: new Types.ObjectId(input.partnerId),
    rejectionReason: "",
    documents: input.documents,
  });
  await ListingImageModel().insertMany(
    input.images.map((image, index) => ({
      listingId: created._id,
      url: image.url,
      order: index,
      alt: `${title}, photo ${index + 1}`,
      contentHash: image.contentHash,
    })),
  );
  revalidateTag("listings");
  return String(created._id);
}
