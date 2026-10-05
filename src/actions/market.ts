"use server";

import { headers } from "next/headers";
import { clientIpFromHeaders } from "@/lib/origin";
import { verifyEnquiryProof } from "@/lib/otp";
import { rateLimit } from "@/lib/rate-limit";
import { readUpload, saveUpload } from "@/lib/storage";
import { requireUser } from "@/lib/session";
import { createEnquiry, createPartnerApplication, createPartnerListing, decidePartnerApplication, updateEnquiry } from "@/services/partners";
import { approveListing, listLiveLocalities, rejectListing } from "@/services/verification";
import { enquirySchema, listingFormSchema, partnerApplicationSchema, checklistSchema, rejectListingSchema, enquiryUpdateSchema, partnerDecisionSchema } from "@/validations/schemas";

export interface ActionState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join(".");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export async function submitEnquiry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = enquirySchema.safeParse({
    listingId: formData.get("listingId"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    preferredTime: formData.get("preferredTime"),
    message: formData.get("message") ?? "",
    proof: formData.get("proof"),
  });
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
  if (!verifyEnquiryProof(parsed.data.proof, parsed.data.phone)) {
    return { ok: false, error: "Confirm your mobile number before sending the enquiry." };
  }
  const ip = clientIpFromHeaders(headers());
  const limit = rateLimit(`enquiry:${ip}:${parsed.data.phone}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return { ok: false, error: "Too many enquiries from this network. Try again in a little while." };
  try {
    await createEnquiry(parsed.data);
  } catch {
    return { ok: false, error: "That home is no longer open for enquiries." };
  }
  return { ok: true };
}

export async function submitPartnerApplication(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = partnerApplicationSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    city: formData.get("city"),
    experience: formData.get("experience"),
    about: formData.get("about"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error.issues), error: "Check the highlighted fields." };
  const ip = clientIpFromHeaders(headers());
  const limit = rateLimit(`partner:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return { ok: false, error: "Too many applications from this network. Try again later." };
  await createPartnerApplication(parsed.data);
  return { ok: true };
}

export async function submitPartnerListing(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser(["PARTNER", "ADMIN"]);
  const bhkRaw = formData.get("bhk");
  const floorRaw = formData.get("floor");
  const totalFloorsRaw = formData.get("totalFloors");
  const ageRaw = formData.get("ageYears");
  const amenities = formData.getAll("amenities").filter((item): item is string => typeof item === "string");
  const parsed = listingFormSchema.safeParse({
    title: formData.get("title") ?? "",
    propertyType: formData.get("propertyType"),
    bhk: bhkRaw && bhkRaw !== "none" ? Number(bhkRaw) : null,
    localityId: formData.get("localityId"),
    areaSqFt: Number(formData.get("areaSqFt")),
    price: Number(formData.get("price")),
    address: formData.get("address"),
    landmark: formData.get("landmark") ?? "",
    lat: Number(formData.get("lat")),
    lng: Number(formData.get("lng")),
    approvingAuthority: formData.get("approvingAuthority"),
    possessionStatus: formData.get("possessionStatus"),
    furnishing: formData.get("furnishing"),
    floor: floorRaw ? Number(floorRaw) : null,
    totalFloors: totalFloorsRaw ? Number(totalFloorsRaw) : null,
    facing: formData.get("facing"),
    ageYears: ageRaw ? Number(ageRaw) : null,
    amenities,
    description: formData.get("description"),
  });
  if (!parsed.success) return { ok: false, error: "Check the property details.", fieldErrors: fieldErrors(parsed.error.issues) };
  const localities = await listLiveLocalities();
  const locality = localities.find((item) => item.id === parsed.data.localityId);
  if (!locality) return { ok: false, error: "Choose a locality in the live city." };
  try {
    const photos = formData.getAll("photos");
    const storedPhotos: { url: string; alt: string; contentHash: string }[] = [];
    for (const photo of photos) {
      const file = await readUpload(photo, { maxBytes: 8 * 1024 * 1024 });
      if (!file) continue;
      const saved = await saveUpload({ ...file, folder: "listings" });
      storedPhotos.push({ url: saved.url, alt: "Listing photo", contentHash: saved.contentHash });
    }
    if (storedPhotos.length < 2) return { ok: false, error: "Add at least two photos." };
    if (storedPhotos.length > 12) return { ok: false, error: "You can attach up to twelve photos." };
    const documents: { name: string; url: string; kind: string }[] = [];
    for (const entry of formData.getAll("documents")) {
      const file = await readUpload(entry, { documents: true, maxBytes: 8 * 1024 * 1024 });
      if (!file) continue;
      const saved = await saveUpload({ ...file, folder: "documents" });
      const name = entry instanceof File ? entry.name : "Document";
      documents.push({ name: name.slice(0, 80), url: saved.url, kind: file.contentType });
    }
    if (documents.length < 1) return { ok: false, error: "Attach at least one ownership or approval document." };
    await createPartnerListing({
      partnerId: user.id,
      values: {
        ...parsed.data,
        lat: Number.isFinite(parsed.data.lat) ? parsed.data.lat : locality.lat,
        lng: Number.isFinite(parsed.data.lng) ? parsed.data.lng : locality.lng,
      },
      images: storedPhotos,
      documents,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The listing could not be saved.";
    return { ok: false, error: message };
  }
  return { ok: true };
}

function flag(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

export async function submitApproval(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser(["ADMIN", "INSPECTOR"]);
  const parsed = checklistSchema.safeParse({
    listingId: formData.get("listingId"),
    photosMatch: flag(formData, "photosMatch"),
    addressConfirmed: flag(formData, "addressConfirmed"),
    areaMeasured: flag(formData, "areaMeasured"),
    ownershipDocsSeen: flag(formData, "ownershipDocsSeen"),
    authorityApprovalChecked: flag(formData, "authorityApprovalChecked"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { ok: false, error: "Checklist is incomplete." };
  const photos: string[] = [];
  try {
    for (const entry of formData.getAll("inspectionPhotos")) {
      const file = await readUpload(entry, { maxBytes: 4 * 1024 * 1024 });
      if (!file) continue;
      const saved = await saveUpload({ ...file, folder: "inspections" });
      photos.push(saved.url);
    }
    await approveListing({
      listingId: parsed.data.listingId,
      inspectorId: user.id,
      checklist: {
        photosMatch: parsed.data.photosMatch,
        addressConfirmed: parsed.data.addressConfirmed,
        areaMeasured: parsed.data.areaMeasured,
        ownershipDocsSeen: parsed.data.ownershipDocsSeen,
        authorityApprovalChecked: parsed.data.authorityApprovalChecked,
      },
      notes: parsed.data.notes,
      inspectionPhotos: photos,
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not verify this listing." };
  }
  return { ok: true };
}

export async function submitRejection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser(["ADMIN", "INSPECTOR"]);
  const parsed = rejectListingSchema.safeParse({ listingId: formData.get("listingId"), reason: formData.get("reason") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Add a reason." };
  await rejectListing(parsed.data.listingId, parsed.data.reason);
  return { ok: true };
}

export async function submitEnquiryUpdate(formData: FormData): Promise<void> {
  await requireUser(["ADMIN", "INSPECTOR"]);
  const parsed = enquiryUpdateSchema.safeParse({
    enquiryId: formData.get("enquiryId"),
    status: formData.get("status"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return;
  await updateEnquiry(parsed.data.enquiryId, parsed.data.status, parsed.data.notes);
}

export async function submitPartnerDecision(formData: FormData): Promise<void> {
  await requireUser(["ADMIN"]);
  const parsed = partnerDecisionSchema.safeParse({
    applicationId: formData.get("applicationId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;
  await decidePartnerApplication(parsed.data.applicationId, parsed.data.status);
}
