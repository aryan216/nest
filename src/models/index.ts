import { Schema, Types, model, models, type Model } from "mongoose";
import type {
  EnquiryStatus,
  Furnishing,
  ListingStatus,
  PartnerApplicationStatus,
  PossessionStatus,
  PreferredTime,
  PropertyType,
  UserRole,
} from "@/types/domain";

function registerModel<T>(name: string, schema: Schema<T>): Model<T> {
  const existing = models[name] as Model<T> | undefined;
  if (existing) return existing;
  return model<T>(name, schema);
}

export interface CityAttrs {
  name: string;
  slug: string;
  state: string;
  isLive: boolean;
  lat: number;
  lng: number;
}

const citySchema = new Schema<CityAttrs>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    state: { type: String, required: true },
    isLive: { type: Boolean, required: true, default: false },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { collection: "cities" },
);

export interface LocalityAttrs {
  name: string;
  slug: string;
  cityId: Types.ObjectId;
  lat: number;
  lng: number;
}

const localitySchema = new Schema<LocalityAttrs>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    cityId: { type: Types.ObjectId, ref: "City", required: true, index: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { collection: "localities" },
);
localitySchema.index({ cityId: 1, slug: 1 }, { unique: true });

export interface UserAttrs {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  image: string;
}

const userSchema = new Schema<UserAttrs>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    role: { type: String, required: true, enum: ["BUYER", "PARTNER", "INSPECTOR", "ADMIN"] },
    image: { type: String, default: "" },
  },
  { collection: "users", timestamps: true },
);

const documentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    kind: { type: String, required: true },
  },
  { _id: false },
);

export interface ListingAttrs {
  publicId: string;
  slug: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  bhk: number | null;
  areaSqFt: number;
  price: number;
  pricePerSqFt: number;
  cityId: Types.ObjectId;
  localityId: Types.ObjectId;
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
  verifiedAt: Date | null;
  verifiedById: Types.ObjectId | null;
  partnerId: Types.ObjectId | null;
  rejectionReason: string;
  documents: { name: string; url: string; kind: string }[];
  createdAt?: Date;
  updatedAt?: Date;
}

const listingSchema = new Schema<ListingAttrs>(
  {
    publicId: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    propertyType: {
      type: String,
      required: true,
      enum: ["FLAT", "PLOT", "ROW_HOUSE", "VILLA", "STUDIO", "INDEPENDENT_HOUSE", "COMMERCIAL", "FARM_LAND"],
    },
    bhk: { type: Number, default: null },
    areaSqFt: { type: Number, required: true },
    price: { type: Number, required: true },
    pricePerSqFt: { type: Number, required: true },
    cityId: { type: Types.ObjectId, ref: "City", required: true, index: true },
    localityId: { type: Types.ObjectId, ref: "Locality", required: true, index: true },
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    approvingAuthority: { type: String, default: "" },
    possessionStatus: { type: String, required: true, enum: ["READY_TO_MOVE", "UNDER_CONSTRUCTION"] },
    furnishing: { type: String, required: true, enum: ["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"] },
    floor: { type: Number, default: null },
    totalFloors: { type: Number, default: null },
    facing: { type: String, default: "" },
    ageYears: { type: Number, default: null },
    amenities: { type: [String], default: [] },
    status: {
      type: String,
      required: true,
      enum: ["DRAFT", "PENDING_VERIFICATION", "VERIFIED", "SOLD", "REJECTED"],
      index: true,
    },
    verifiedAt: { type: Date, default: null },
    verifiedById: { type: Types.ObjectId, ref: "User", default: null },
    partnerId: { type: Types.ObjectId, ref: "User", default: null, index: true },
    rejectionReason: { type: String, default: "" },
    documents: { type: [documentSchema], default: [] },
  },
  { collection: "listings", timestamps: true },
);
listingSchema.index({ status: 1, cityId: 1, propertyType: 1 });

export interface ListingImageAttrs {
  listingId: Types.ObjectId;
  url: string;
  order: number;
  alt: string;
  contentHash: string;
}

const listingImageSchema = new Schema<ListingImageAttrs>(
  {
    listingId: { type: Types.ObjectId, ref: "Listing", required: true, index: true },
    url: { type: String, required: true },
    order: { type: Number, required: true },
    alt: { type: String, required: true },
    contentHash: { type: String, required: true, index: true },
  },
  { collection: "listing_images" },
);

export interface EnquiryAttrs {
  listingId: Types.ObjectId;
  name: string;
  phone: string;
  message: string;
  preferredTime: PreferredTime;
  status: EnquiryStatus;
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const enquirySchema = new Schema<EnquiryAttrs>(
  {
    listingId: { type: Types.ObjectId, ref: "Listing", required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String, default: "" },
    preferredTime: { type: String, required: true, enum: ["Morning", "Afternoon", "Evening", "Anytime"] },
    status: { type: String, required: true, enum: ["NEW", "CONTACTED", "VISIT_SCHEDULED", "CLOSED"], default: "NEW" },
    notes: { type: String, default: "" },
  },
  { collection: "enquiries", timestamps: true },
);

export interface PartnerApplicationAttrs {
  name: string;
  phone: string;
  email: string;
  city: string;
  experience: string;
  about: string;
  status: PartnerApplicationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const partnerApplicationSchema = new Schema<PartnerApplicationAttrs>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    city: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    status: { type: String, required: true, enum: ["NEW", "REVIEWING", "APPROVED", "DECLINED"], default: "NEW" },
  },
  { collection: "partner_applications", timestamps: true },
);

export interface VerificationChecklist {
  photosMatch: boolean;
  addressConfirmed: boolean;
  areaMeasured: boolean;
  ownershipDocsSeen: boolean;
  authorityApprovalChecked: boolean;
}

export interface VerificationReportAttrs {
  listingId: Types.ObjectId;
  inspectorId: Types.ObjectId;
  checklist: VerificationChecklist;
  notes: string;
  inspectionPhotos: string[];
  verifiedAt: Date;
}

const verificationReportSchema = new Schema<VerificationReportAttrs>(
  {
    listingId: { type: Types.ObjectId, ref: "Listing", required: true, unique: true },
    inspectorId: { type: Types.ObjectId, ref: "User", required: true },
    checklist: {
      photosMatch: { type: Boolean, required: true },
      addressConfirmed: { type: Boolean, required: true },
      areaMeasured: { type: Boolean, required: true },
      ownershipDocsSeen: { type: Boolean, required: true },
      authorityApprovalChecked: { type: Boolean, required: true },
    },
    notes: { type: String, default: "" },
    inspectionPhotos: { type: [String], default: [] },
    verifiedAt: { type: Date, required: true },
  },
  { collection: "verification_reports" },
);

export interface SavedListingAttrs {
  userId: Types.ObjectId;
  listingId: Types.ObjectId;
}

const savedListingSchema = new Schema<SavedListingAttrs>(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    listingId: { type: Types.ObjectId, ref: "Listing", required: true },
  },
  { collection: "saved_listings", timestamps: true },
);
savedListingSchema.index({ userId: 1, listingId: 1 }, { unique: true });

export interface TestimonialAttrs {
  name: string;
  role: string;
  quote: string;
  order: number;
  published: boolean;
  isSample: boolean;
}

const testimonialSchema = new Schema<TestimonialAttrs>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    quote: { type: String, required: true },
    order: { type: Number, required: true },
    published: { type: Boolean, required: true, default: false },
    isSample: { type: Boolean, required: true, default: false },
  },
  { collection: "testimonials" },
);

export interface OtpChallengeAttrs {
  target: string;
  purpose: "LOGIN" | "ENQUIRY";
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
  createdAt?: Date;
}

const otpChallengeSchema = new Schema<OtpChallengeAttrs>(
  {
    target: { type: String, required: true, index: true },
    purpose: { type: String, required: true, enum: ["LOGIN", "ENQUIRY"] },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, required: true, default: 0 },
    consumedAt: { type: Date, default: null },
  },
  { collection: "otp_challenges", timestamps: { createdAt: true, updatedAt: false } },
);
otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CityModel = () => registerModel<CityAttrs>("City", citySchema);
export const LocalityModel = () => registerModel<LocalityAttrs>("Locality", localitySchema);
export const UserModel = () => registerModel<UserAttrs>("User", userSchema);
export const ListingModel = () => registerModel<ListingAttrs>("Listing", listingSchema);
export const ListingImageModel = () => registerModel<ListingImageAttrs>("ListingImage", listingImageSchema);
export const EnquiryModel = () => registerModel<EnquiryAttrs>("Enquiry", enquirySchema);
export const PartnerApplicationModel = () => registerModel<PartnerApplicationAttrs>("PartnerApplication", partnerApplicationSchema);
export const VerificationReportModel = () => registerModel<VerificationReportAttrs>("VerificationReport", verificationReportSchema);
export const SavedListingModel = () => registerModel<SavedListingAttrs>("SavedListing", savedListingSchema);
export const TestimonialModel = () => registerModel<TestimonialAttrs>("Testimonial", testimonialSchema);
export const OtpChallengeModel = () => registerModel<OtpChallengeAttrs>("OtpChallenge", otpChallengeSchema);
