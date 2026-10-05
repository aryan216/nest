import { z } from "zod";
import {
  ENQUIRY_STATUSES,
  FURNISHING_OPTIONS,
  PARTNER_APPLICATION_STATUSES,
  POSSESSION_STATUSES,
  PREFERRED_TIMES,
  PROPERTY_TYPES,
  SORT_OPTIONS,
} from "@/types/domain";
import { normalizePhone } from "@/lib/contact";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Choose a valid record.");

export const phoneSchema = z
  .string()
  .transform((value) => normalizePhone(value))
  .refine((value) => /^[6-9]\d{9}$/.test(value), "Enter a 10-digit Indian mobile number.");

export const emailSchema = z.string().trim().email("Enter a valid email.").transform((value) => value.toLowerCase());

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(128),
});

export const otpRequestSchema = z.object({
  target: z.string().trim().min(3).max(160),
  purpose: z.enum(["LOGIN", "ENQUIRY"]),
});

export const enquirySchema = z.object({
  listingId: objectId,
  name: z.string().trim().min(2, "Tell us your name.").max(80),
  phone: phoneSchema,
  preferredTime: z.enum(PREFERRED_TIMES),
  message: z.string().trim().max(1000).optional().default(""),
  proof: z.string().min(10),
});

export const partnerApplicationSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name.").max(80),
  phone: phoneSchema,
  email: emailSchema,
  city: z.string().trim().min(2).max(60),
  experience: z.string().trim().min(2, "Share how long you have worked with property.").max(120),
  about: z.string().trim().min(30, "Tell us a little more about the homes you handle.").max(1500),
});

export const listingFormSchema = z
  .object({
    title: z.string().trim().max(120).optional().default(""),
    propertyType: z.enum(PROPERTY_TYPES),
    bhk: z.number().int().min(1).max(8).nullable(),
    localityId: objectId,
    areaSqFt: z.number().int().positive().max(5_000_000),
    price: z.number().int().positive().max(5_000_000_000),
    address: z.string().trim().min(8, "Add a street address.").max(200),
    landmark: z.string().trim().max(120).optional().default(""),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    approvingAuthority: z.string().trim().min(2, "Name the approving authority.").max(80),
    possessionStatus: z.enum(POSSESSION_STATUSES),
    furnishing: z.enum(FURNISHING_OPTIONS),
    floor: z.number().int().min(0).max(80).nullable(),
    totalFloors: z.number().int().min(1).max(80).nullable(),
    facing: z.string().trim().min(2).max(40),
    ageYears: z.number().int().min(0).max(150).nullable(),
    amenities: z.array(z.string().trim().min(1).max(40)).max(20),
    description: z.string().trim().min(40, "Describe the home in a few sentences.").max(2000),
  })
  .superRefine((value, ctx) => {
    const needsBhk =
      value.propertyType === "FLAT" ||
      value.propertyType === "ROW_HOUSE" ||
      value.propertyType === "VILLA" ||
      value.propertyType === "INDEPENDENT_HOUSE";
    if (needsBhk && !value.bhk) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bhk"], message: "Choose how many bedrooms this home has." });
    }
    if (value.floor !== null && value.totalFloors !== null && value.floor > value.totalFloors) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["floor"], message: "Floor cannot be higher than the building." });
    }
    const plotLike = value.propertyType === "PLOT" || value.propertyType === "FARM_LAND";
    if (plotLike && value.furnishing !== "UNFURNISHED") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["furnishing"], message: "Plots and farm land should stay unfurnished." });
    }
  });

export const checklistSchema = z.object({
  listingId: objectId,
  photosMatch: z.boolean(),
  addressConfirmed: z.boolean(),
  areaMeasured: z.boolean(),
  ownershipDocsSeen: z.boolean(),
  authorityApprovalChecked: z.boolean(),
  notes: z.string().trim().max(2000),
});

export const rejectListingSchema = z.object({
  listingId: objectId,
  reason: z.string().trim().min(10, "Add a short reason the partner can act on.").max(500),
});

export const enquiryUpdateSchema = z.object({
  enquiryId: objectId,
  status: z.enum(ENQUIRY_STATUSES),
  notes: z.string().trim().max(2000),
});

export const partnerDecisionSchema = z.object({
  applicationId: objectId,
  status: z.enum(PARTNER_APPLICATION_STATUSES),
});

export const savedToggleSchema = z.object({
  listingId: objectId,
  saved: z.boolean(),
});

export const savedSyncSchema = z.object({
  ids: z.array(objectId).max(50),
});

export const searchQuerySchema = z.object({
  type: z.enum(PROPERTY_TYPES).optional(),
  locality: z.array(z.string().regex(/^[a-z0-9-]+$/)).max(12).optional(),
  budgetMin: z.number().int().nonnegative().optional(),
  budgetMax: z.number().int().positive().optional(),
  bhk: z.array(z.number().int().min(1).max(8)).max(6).optional(),
  areaMin: z.number().int().nonnegative().optional(),
  areaMax: z.number().int().positive().optional(),
  authority: z.string().trim().max(80).optional(),
  possession: z.enum(POSSESSION_STATUSES).optional(),
  sort: z.enum(SORT_OPTIONS).optional(),
  page: z.number().int().positive().max(500).optional(),
  view: z.enum(["list", "map"]).optional(),
});

export type ListingFormValues = z.infer<typeof listingFormSchema>;
export type EnquiryInput = z.infer<typeof enquirySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
