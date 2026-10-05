import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { brand } from "../config/brand";
import { connectDB } from "../lib/db";
import { buildListingSlug, buildListingTitle, computePricePerSqFt } from "../lib/listing-identity";
import {
  CityModel,
  EnquiryModel,
  ListingImageModel,
  ListingModel,
  LocalityModel,
  OtpChallengeModel,
  PartnerApplicationModel,
  SavedListingModel,
  TestimonialModel,
  UserModel,
  VerificationReportModel,
} from "../models";
import type { Furnishing, PossessionStatus, PropertyType } from "../types/domain";

const localities = [
  { name: "Gomti Nagar", slug: "gomti-nagar", lat: 26.8505, lng: 81.0006, ppsf: 8200 },
  { name: "Hazratganj", slug: "hazratganj", lat: 26.856, lng: 80.946, ppsf: 9800 },
  { name: "Aliganj", slug: "aliganj", lat: 26.886, lng: 80.943, ppsf: 6100 },
  { name: "Indira Nagar", slug: "indira-nagar", lat: 26.872, lng: 80.998, ppsf: 7000 },
  { name: "Jankipuram", slug: "jankipuram", lat: 26.92, lng: 80.95, ppsf: 4800 },
  { name: "Sushant Golf City", slug: "sushant-golf-city", lat: 26.77, lng: 81.01, ppsf: 5400 },
  { name: "Ashiyana", slug: "ashiyana", lat: 26.81, lng: 80.91, ppsf: 4500 },
  { name: "Chinhat", slug: "chinhat", lat: 26.88, lng: 81.04, ppsf: 3900 },
] as const;

const typePlan: PropertyType[] = [
  ...Array<PropertyType>(16).fill("FLAT"),
  ...Array<PropertyType>(8).fill("PLOT"),
  ...Array<PropertyType>(4).fill("ROW_HOUSE"),
  ...Array<PropertyType>(3).fill("VILLA"),
  ...Array<PropertyType>(3).fill("STUDIO"),
  ...Array<PropertyType>(3).fill("INDEPENDENT_HOUSE"),
  ...Array<PropertyType>(2).fill("COMMERCIAL"),
  ...Array<PropertyType>(1).fill("FARM_LAND"),
];

const authorities = ["LDA", "RERA", "Nagar Nigam", "Awas Vikas"];
const facings = ["North", "East", "North-East", "South", "West", "South-East"];
const furnishings: Furnishing[] = ["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"];
const possessions: PossessionStatus[] = ["READY_TO_MOVE", "UNDER_CONSTRUCTION"];
const amenityPool = ["Reserved parking", "Lift", "Power backup", "Park facing", "Piped water", "Balcony", "CCTV", "Visitor parking"];

function bhkFor(type: PropertyType, index: number): number | null {
  if (type === "PLOT" || type === "FARM_LAND" || type === "COMMERCIAL" || type === "STUDIO") return null;
  if (type === "VILLA") return 3 + (index % 3);
  if (type === "ROW_HOUSE") return 2 + (index % 2);
  if (type === "INDEPENDENT_HOUSE") return 2 + (index % 3);
  return 1 + (index % 4);
}

function areaFor(type: PropertyType, bhk: number | null, index: number): number {
  if (type === "STUDIO") return 420 + (index % 4) * 30;
  if (type === "PLOT") return 1200 + (index % 6) * 400;
  if (type === "FARM_LAND") return 20000 + (index % 3) * 8000;
  if (type === "COMMERCIAL") return 600 + (index % 4) * 220;
  const base = bhk === 1 ? 640 : bhk === 2 ? 980 : bhk === 3 ? 1460 : bhk === 4 ? 2100 : 2680;
  return base + (index % 4) * 35;
}

async function downloadPhoto(id: number, destination: string): Promise<boolean> {
  try {
    const response = await fetch(`https://picsum.photos/id/${id}/1200/900`, {
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return false;
    const type = response.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return false;
    await writeFile(destination, Buffer.from(await response.arrayBuffer()));
    return true;
  } catch {
    return false;
  }
}

async function collectPhotos(count: number): Promise<{ url: string; hash: string }[]> {
  const directory = path.join(process.cwd(), "public", "media", "seed");
  await mkdir(directory, { recursive: true });
  const photos: { url: string; hash: string }[] = [];
  let cursor = 10;
  while (photos.length < count && cursor < 700) {
    const batch = Array.from({ length: 12 }, (_, offset) => cursor + offset);
    cursor += batch.length;
    const downloaded = await Promise.all(
      batch.map(async (id) => {
        const filename = `photo-${id}.jpg`;
        const full = path.join(directory, filename);
        const ok = await downloadPhoto(id, full);
        if (!ok) return null;
        const bytes = await readFile(full);
        return { url: `/media/seed/${filename}`, hash: createHash("sha256").update(bytes).digest("hex") };
      }),
    );
    for (const photo of downloaded) {
      if (photo && photos.length < count) photos.push(photo);
    }
    console.info(`Downloaded ${photos.length} photos`);
  }
  if (photos.length < count) {
    throw new Error(`Only downloaded ${photos.length} photos, needed ${count}.`);
  }
  return photos;
}

async function seed() {
  await connectDB();
  await Promise.all([
    CityModel().deleteMany({}),
    LocalityModel().deleteMany({}),
    UserModel().deleteMany({}),
    ListingModel().deleteMany({}),
    ListingImageModel().deleteMany({}),
    EnquiryModel().deleteMany({}),
    PartnerApplicationModel().deleteMany({}),
    VerificationReportModel().deleteMany({}),
    SavedListingModel().deleteMany({}),
    TestimonialModel().deleteMany({}),
    OtpChallengeModel().deleteMany({}),
  ]);

  const lucknow = await CityModel().create({
    name: brand.city,
    slug: brand.citySlug,
    state: brand.state,
    isLive: true,
    lat: 26.8467,
    lng: 80.9462,
  });
  for (const city of brand.comingSoonCities) {
    await CityModel().create({ name: city.name, slug: city.slug, state: brand.state, isLive: false, lat: 26.5, lng: 80.3 });
  }
  const localityDocs = [];
  for (const locality of localities) {
    localityDocs.push(await LocalityModel().create({ ...locality, cityId: lucknow._id }));
  }
  const inspector = await UserModel().create({ name: "Inspection Desk", email: "inspector@nestverify.test", phone: "", role: "INSPECTOR", image: "" });
  const partner = await UserModel().create({ name: "Partner Desk", email: "partner@nestverify.test", phone: "9876543210", role: "PARTNER", image: "" });
  await UserModel().create({ name: "Admin Desk", email: "admin@nestverify.test", phone: "", role: "ADMIN", image: "" });

  const photoCount = typePlan.length * 3 + 12;
  console.info(`Downloading ${photoCount} unique photos`);
  const photos = await collectPhotos(photoCount);
  let photoCursor = 0;
  const sanction = path.join(process.cwd(), "public", "media", "seed", "sanction-note.txt");
  await writeFile(sanction, "Sample sanction note used by the seed data. Replace with real papers in production.\n");

  for (let index = 0; index < typePlan.length; index += 1) {
    const propertyType = typePlan[index] ?? "FLAT";
    const locality = localityDocs[index % localityDocs.length];
    const localitySource = localities[index % localities.length];
    if (!locality || !localitySource) continue;
    const bhk = bhkFor(propertyType, index);
    const areaSqFt = areaFor(propertyType, bhk, index);
    const ppsf = Math.round(localitySource.ppsf * (0.94 + (index % 5) * 0.03));
    const price = ppsf * areaSqFt;
    const identity = { propertyType, bhk, localityName: locality.name };
    const publicId = `nv${index.toString(36).padStart(4, "0")}`;
    const title = buildListingTitle(identity);
    const createdAt = new Date(Date.now() - (typePlan.length - index) * 24 * 60 * 60 * 1000);
    const verifiedAt = new Date(createdAt.getTime() + 20 * 60 * 60 * 1000);
    const listing = await ListingModel().create({
      publicId,
      slug: buildListingSlug({ ...identity, publicId }),
      title,
      description: `A ${title.toLowerCase()} with ${areaSqFt.toLocaleString("en-IN")} sq ft on record. The papers name ${authorities[index % authorities.length]} as the approving authority. The home faces ${facings[index % facings.length]} and was measured during the ${brand.name} visit in ${brand.city}. Buyers deal with ${brand.name} directly and do not pay brokerage.`,
      propertyType,
      bhk,
      areaSqFt,
      price,
      pricePerSqFt: computePricePerSqFt(price, areaSqFt),
      cityId: lucknow._id,
      localityId: locality._id,
      address: `${12 + index}, Block ${String.fromCharCode(65 + (index % 6))}, ${locality.name}, ${brand.city}`,
      lat: locality.lat + ((index % 5) - 2) * 0.0035,
      lng: locality.lng + ((index % 4) - 1) * 0.0035,
      approvingAuthority: authorities[index % authorities.length] ?? "LDA",
      possessionStatus: possessions[index % possessions.length] ?? "READY_TO_MOVE",
      furnishing: furnishings[index % furnishings.length] ?? "UNFURNISHED",
      floor: propertyType === "FLAT" || propertyType === "STUDIO" ? (index % 8) + 1 : null,
      totalFloors: propertyType === "FLAT" || propertyType === "STUDIO" ? 12 : propertyType === "PLOT" || propertyType === "FARM_LAND" ? null : 2,
      facing: facings[index % facings.length] ?? "East",
      ageYears: index % 18,
      amenities: amenityPool.slice(index % 3, (index % 3) + 4),
      status: "VERIFIED",
      verifiedAt,
      verifiedById: inspector._id,
      partnerId: partner._id,
      rejectionReason: "",
      documents: [{ name: "Sanction letter", url: "/media/seed/sanction-note.txt", kind: "text/plain" }],
      createdAt,
      updatedAt: verifiedAt,
    });
    const set = photos.slice(photoCursor, photoCursor + 3);
    photoCursor += 3;
    await ListingImageModel().insertMany(
      set.map((photo, order) => ({
        listingId: listing._id,
        url: photo.url,
        order,
        alt: `${title}, photo ${order + 1}`,
        contentHash: photo.hash,
      })),
    );
    await VerificationReportModel().create({
      listingId: listing._id,
      inspectorId: inspector._id,
      checklist: {
        photosMatch: true,
        addressConfirmed: true,
        areaMeasured: true,
        ownershipDocsSeen: true,
        authorityApprovalChecked: true,
      },
      notes: `Measured on site in ${locality.name}. Papers matched the address used on this listing.`,
      inspectionPhotos: set[0] ? [set[0].url] : [],
      verifiedAt,
    });
  }

  const firstImage = await ListingImageModel().findOne().sort({ order: 1 });
  const gomti = localityDocs[0];
  if (gomti && firstImage) {
    const badIdentity = { propertyType: "FLAT" as const, bhk: 4, localityName: gomti.name };
    const badPublicId = "nvbad01";
    const bad = await ListingModel().create({
      publicId: badPublicId,
      slug: buildListingSlug({ ...badIdentity, publicId: badPublicId }),
      title: buildListingTitle(badIdentity),
      description: "This pending home is intentionally small for a 4 BHK so the data-quality panel can flag it.",
      propertyType: "FLAT",
      bhk: 4,
      areaSqFt: 820,
      price: 820 * 9000,
      pricePerSqFt: 9000,
      cityId: lucknow._id,
      localityId: gomti._id,
      address: `1, Quality Lane, ${gomti.name}, ${brand.city}`,
      lat: gomti.lat,
      lng: gomti.lng,
      approvingAuthority: "LDA",
      possessionStatus: "READY_TO_MOVE",
      furnishing: "UNFURNISHED",
      floor: 2,
      totalFloors: 4,
      facing: "East",
      ageYears: 3,
      amenities: ["Lift"],
      status: "PENDING_VERIFICATION",
      verifiedAt: null,
      verifiedById: null,
      partnerId: partner._id,
      rejectionReason: "",
      documents: [],
    });
    await ListingImageModel().create({
      listingId: bad._id,
      url: firstImage.url,
      order: 0,
      alt: "Shared photo used to demonstrate the duplicate warning",
      contentHash: firstImage.contentHash,
    });
    const spare = photos[photoCursor];
    photoCursor += 1;
    if (spare) {
      await ListingImageModel().create({
        listingId: bad._id,
        url: spare.url,
        order: 1,
        alt: "Second photo on the quality sample",
        contentHash: spare.hash,
      });
    }
  }

  const chinhat = localityDocs[7];
  if (chinhat) {
    const pendingIdentity = { propertyType: "ROW_HOUSE" as const, bhk: 3, localityName: chinhat.name };
    const pendingId = "nvpend1";
    const pending = await ListingModel().create({
      publicId: pendingId,
      slug: buildListingSlug({ ...pendingIdentity, publicId: pendingId }),
      title: buildListingTitle(pendingIdentity),
      description: "A row house submitted by the partner desk and waiting for the inspector visit. It is not public.",
      propertyType: "ROW_HOUSE",
      bhk: 3,
      areaSqFt: 1480,
      price: 1480 * 4200,
      pricePerSqFt: computePricePerSqFt(1480 * 4200, 1480),
      cityId: lucknow._id,
      localityId: chinhat._id,
      address: `18, Orchard Row, ${chinhat.name}, ${brand.city}`,
      lat: chinhat.lat,
      lng: chinhat.lng,
      approvingAuthority: "Awas Vikas",
      possessionStatus: "READY_TO_MOVE",
      furnishing: "SEMI_FURNISHED",
      floor: null,
      totalFloors: 2,
      facing: "North",
      ageYears: 6,
      amenities: ["Reserved parking", "Piped water"],
      status: "PENDING_VERIFICATION",
      verifiedAt: null,
      verifiedById: null,
      partnerId: partner._id,
      rejectionReason: "",
      documents: [{ name: "Sale deed copy", url: "/media/seed/sanction-note.txt", kind: "text/plain" }],
    });
    const pendingPhotos = photos.slice(photoCursor, photoCursor + 3);
    photoCursor += 3;
    await ListingImageModel().insertMany(
      pendingPhotos.map((photo, order) => ({
        listingId: pending._id,
        url: photo.url,
        order,
        alt: `${pending.title}, photo ${order + 1}`,
        contentHash: photo.hash,
      })),
    );
  }

  await TestimonialModel().insertMany([
    { name: "Sample buyer, Gomti Nagar", role: "Sample story", quote: "The checklist told me the area had been measured on site, not copied from a brochure.", order: 1, published: true, isSample: true },
    { name: "Sample buyer, Jankipuram", role: "Sample story", quote: "I asked who would see my number. The answer was only the NestVerify desk, and the partner page never showed it.", order: 2, published: true, isSample: true },
    { name: "Sample buyer, Aliganj", role: "Sample story", quote: "There was no brokerage line on the price. That was the part I wanted in writing.", order: 3, published: true, isSample: true },
  ]);

  const sampleListing = await ListingModel().findOne({ status: "VERIFIED" });
  if (sampleListing) {
    await EnquiryModel().insertMany([
      { listingId: sampleListing._id, name: "Meera Sample", phone: "9811111111", message: "Can we visit on Saturday morning?", preferredTime: "Morning", status: "NEW", notes: "" },
      { listingId: sampleListing._id, name: "Arun Sample", phone: "9822222222", message: "Please confirm the measured area.", preferredTime: "Evening", status: "CONTACTED", notes: "Called once." },
    ]);
  }

  await PartnerApplicationModel().create({
    name: "New Partner Sample",
    phone: "9833333333",
    email: "new.partner@nestverify.test",
    city: brand.city,
    experience: "4 years with resale homes",
    about: "I work with families looking for ready homes and want each listing checked before it is shown.",
    status: "NEW",
  });

  console.info("Seed complete.");
  console.info("Buyer, partner, inspector and admin sign in with an email code.");
  console.info("admin@nestverify.test · inspector@nestverify.test · partner@nestverify.test");
  await (await connectDB()).disconnect();
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Seed failed");
  process.exit(1);
});
