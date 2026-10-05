"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AMENITIES,
  APPROVING_AUTHORITIES,
  FACING_OPTIONS,
  FURNISHING_LABELS,
  POSSESSION_LABELS,
  PROPERTY_CATALOG,
  furnishingLabel,
  possessionLabel,
  propertyMeta,
  typesThatUseBhk,
} from "@/config/catalog";
import { brand } from "@/config/brand";
import { submitPartnerListing, type ActionState } from "@/actions/market";
import { formatArea, formatPerSqFt, formatPriceINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Furnishing, PossessionStatus, PropertyType } from "@/types/domain";
import { cn } from "@/lib/utils";

function previewListingTitle(input: { propertyType: PropertyType; bhk: number | null; localityName: string }): string {
  const label = propertyMeta(input.propertyType).label;
  const skipBhk =
    input.propertyType === "PLOT" ||
    input.propertyType === "FARM_LAND" ||
    input.propertyType === "COMMERCIAL" ||
    input.propertyType === "STUDIO";
  if (input.bhk && input.bhk > 0 && !skipBhk) {
    return `${input.bhk} BHK ${label} in ${input.localityName}`;
  }
  return `${label} in ${input.localityName}`;
}

const initial: ActionState = { ok: false };

const STEPS = [
  { id: "basics", label: "Basics" },
  { id: "specs", label: "Specs" },
  { id: "location", label: "Location" },
  { id: "photos", label: "Photos" },
  { id: "documents", label: "Papers" },
  { id: "review", label: "Review" },
] as const;

interface PhotoItem {
  id: string;
  file: File;
  preview: string;
}

interface DraftValues {
  title: string;
  propertyType: PropertyType;
  bhk: string;
  localityId: string;
  areaSqFt: string;
  price: string;
  address: string;
  landmark: string;
  lat: string;
  lng: string;
  approvingAuthority: string;
  possessionStatus: PossessionStatus;
  furnishing: Furnishing;
  floor: string;
  totalFloors: string;
  facing: string;
  ageYears: string;
  amenities: string[];
  description: string;
}

function Submit() {
  const status = useFormStatus();
  return (
    <Button type="submit" disabled={status.pending} className="min-w-[12rem]">
      {status.pending ? "Uploading to ImageKit…" : "Submit for inspection"}
    </Button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-destructive">{message}</p>;
}

export function ListingWizard({ localities }: { localities: { id: string; name: string; lat: number; lng: number }[] }) {
  const first = localities[0];
  const [state, action] = useFormState(submitPartnerListing, initial);
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [docError, setDocError] = useState("");
  const [draft, setDraft] = useState<DraftValues>({
    title: "",
    propertyType: "FLAT",
    bhk: "3",
    localityId: first?.id ?? "",
    areaSqFt: "",
    price: "",
    address: "",
    landmark: "",
    lat: first ? String(first.lat) : "",
    lng: first ? String(first.lng) : "",
    approvingAuthority: "LDA",
    possessionStatus: "READY_TO_MOVE",
    furnishing: "SEMI_FURNISHED",
    floor: "",
    totalFloors: "",
    facing: "East",
    ageYears: "0",
    amenities: [],
    description: "",
  });
  const router = useRouter();

  const locality = useMemo(
    () => localities.find((item) => item.id === draft.localityId) ?? localities[0],
    [localities, draft.localityId],
  );

  const usesBhk = typesThatUseBhk(draft.propertyType) && draft.propertyType !== "STUDIO";
  const needsFloor = draft.propertyType === "FLAT" || draft.propertyType === "STUDIO" || draft.propertyType === "COMMERCIAL";
  const plotLike = draft.propertyType === "PLOT" || draft.propertyType === "FARM_LAND";

  const previewTitle = useMemo(() => {
    if (draft.title.trim()) return draft.title.trim();
    if (!locality) return "Listing title";
    const bhkValue = usesBhk && draft.bhk !== "none" ? Number(draft.bhk) : null;
    return previewListingTitle({
      propertyType: draft.propertyType,
      bhk: Number.isFinite(bhkValue) ? bhkValue : null,
      localityName: locality.name,
    });
  }, [draft.title, draft.propertyType, draft.bhk, locality, usesBhk]);

  const priceNumber = Number(draft.price);
  const areaNumber = Number(draft.areaSqFt);
  const pricePerSqFt = priceNumber > 0 && areaNumber > 0 ? Math.round(priceNumber / areaNumber) : 0;

  const previewFacts: [string, string][] = [
    ["Type", propertyMeta(draft.propertyType).label],
    ["Area", areaNumber > 0 ? formatArea(areaNumber) : "Add area"],
    ["Price / sq ft", pricePerSqFt > 0 ? formatPerSqFt(pricePerSqFt) : "—"],
    ["Authority", draft.approvingAuthority || "Not stated"],
    ["Possession", possessionLabel(draft.possessionStatus)],
    ["Furnishing", furnishingLabel(draft.furnishing)],
    [
      "Floor",
      draft.floor && draft.totalFloors ? `${draft.floor} of ${draft.totalFloors}` : needsFloor ? "Add floor" : "Not stated",
    ],
    ["Facing", draft.facing || "Not stated"],
    ["Age", draft.ageYears !== "" ? `${draft.ageYears} years` : "Not stated"],
    ["BHK", usesBhk && draft.bhk !== "none" ? `${draft.bhk} BHK` : "Not applicable"],
  ];

  useEffect(() => {
    if (state.ok) router.push("/partner?submitted=1");
  }, [router, state.ok]);

  useEffect(() => {
    return () => {
      for (const photo of photos) URL.revokeObjectURL(photo.preview);
    };
  }, [photos]);

  useEffect(() => {
    if (!state.ok && state.fieldErrors) {
      const keys = Object.keys(state.fieldErrors);
      if (keys.some((key) => ["propertyType", "bhk", "title", "areaSqFt", "price", "description"].includes(key))) setStep(0);
      else if (keys.some((key) => ["approvingAuthority", "possessionStatus", "furnishing", "floor", "totalFloors", "facing", "ageYears", "amenities"].includes(key))) setStep(1);
      else if (keys.some((key) => ["localityId", "address", "landmark", "lat", "lng"].includes(key))) setStep(2);
    }
  }, [state]);

  function updateDraft<K extends keyof DraftValues>(key: K, value: DraftValues[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function setLocality(id: string) {
    const next = localities.find((item) => item.id === id);
    setDraft((prev) => ({
      ...prev,
      localityId: id,
      lat: next ? String(next.lat) : prev.lat,
      lng: next ? String(next.lng) : prev.lng,
    }));
  }

  function setPropertyType(type: PropertyType) {
    setDraft((prev) => ({
      ...prev,
      propertyType: type,
      bhk: typesThatUseBhk(type) && type !== "STUDIO" ? prev.bhk === "none" ? "3" : prev.bhk : "none",
      furnishing: type === "PLOT" || type === "FARM_LAND" ? "UNFURNISHED" : prev.furnishing,
      floor: type === "PLOT" || type === "FARM_LAND" ? "" : prev.floor,
      totalFloors: type === "PLOT" || type === "FARM_LAND" ? "" : prev.totalFloors,
    }));
  }

  function toggleAmenity(amenity: string) {
    setDraft((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity],
    }));
  }

  function addPhotos(files: FileList | null) {
    if (!files) return;
    setPhotoError("");
    const next = [...photos];
    for (const file of Array.from(files)) {
      if (next.length >= 12) {
        setPhotoError("You can upload up to 12 photos.");
        break;
      }
      if (file.size > 8 * 1024 * 1024) {
        setPhotoError("Each photo must be 8 MB or smaller.");
        continue;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setPhotoError("Use JPG, PNG or WebP photos.");
        continue;
      }
      next.push({ id: `${file.name}-${file.size}-${crypto.randomUUID()}`, file, preview: URL.createObjectURL(file) });
    }
    setPhotos(next);
  }

  function movePhoto(from: number, to: number) {
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    setPhotos(next);
  }

  function addDocuments(files: FileList | null) {
    if (!files) return;
    setDocError("");
    const next = [...documents];
    for (const file of Array.from(files)) {
      if (next.length >= 5) {
        setDocError("You can attach up to 5 documents.");
        break;
      }
      if (file.size > 8 * 1024 * 1024) {
        setDocError("Each document must be 8 MB or smaller.");
        continue;
      }
      if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
        setDocError("Use JPG, PNG, WebP or PDF.");
        continue;
      }
      next.push(file);
    }
    setDocuments(next);
  }

  function validateStep(index: number): boolean {
    if (index === 0) {
      if (!draft.areaSqFt || Number(draft.areaSqFt) <= 0) return false;
      if (!draft.price || Number(draft.price) <= 0) return false;
      if (draft.description.trim().length < 40) return false;
      if (usesBhk && (draft.bhk === "none" || !draft.bhk)) return false;
      return true;
    }
    if (index === 1) {
      if (!draft.approvingAuthority || !draft.facing) return false;
      if (needsFloor && (!draft.floor || !draft.totalFloors)) return false;
      return true;
    }
    if (index === 2) {
      return draft.address.trim().length >= 8 && Boolean(draft.localityId) && Boolean(draft.lat) && Boolean(draft.lng);
    }
    if (index === 3) return photos.length >= 2;
    if (index === 4) return documents.length >= 1;
    return true;
  }

  function goNext() {
    if (step === 3 && photos.length < 2) {
      setPhotoError("Add at least two photos so the property page can show a gallery.");
      return;
    }
    if (step === 4 && documents.length < 1) {
      setDocError("Attach at least one ownership or approval paper.");
      return;
    }
    if (!validateStep(step)) {
      if (step === 0) setStep(0);
      return;
    }
    setStep((value) => Math.min(value + 1, STEPS.length - 1));
  }

  return (
    <form
      action={action}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"
      onSubmit={(event) => {
        if (photos.length < 2) {
          event.preventDefault();
          setStep(3);
          setPhotoError("Add at least two photos so the property page can show a gallery.");
          return;
        }
        if (documents.length < 1) {
          event.preventDefault();
          setStep(4);
          setDocError("Attach at least one ownership or approval paper.");
          return;
        }
        const data = new FormData(event.currentTarget);
        data.delete("photos");
        data.delete("documents");
        for (const photo of photos) data.append("photos", photo.file);
        for (const doc of documents) data.append("documents", doc);
        for (const amenity of draft.amenities) data.append("amenities", amenity);
        event.preventDefault();
        action(data);
      }}
    >
      <div className="space-y-6">
        <ol className="flex flex-wrap gap-2" aria-label="Listing steps">
          {STEPS.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={cn(
                  "min-h-11 rounded-full px-4 text-sm font-semibold transition-colors",
                  index === step ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-[#dce5fa]",
                )}
                onClick={() => setStep(index)}
                aria-current={index === step ? "step" : undefined}
              >
                {index + 1}. {item.label}
              </button>
            </li>
          ))}
        </ol>

        <section hidden={step !== 0} className="grid gap-4 rounded-3xl border border-border bg-card p-5 md:grid-cols-2">
          {!usesBhk ? <input type="hidden" name="bhk" value="none" /> : null}
          <div className="md:col-span-2">
            <Label htmlFor="title">Listing title (optional)</Label>
            <Input
              id="title"
              name="title"
              value={draft.title}
              onChange={(event) => updateDraft("title", event.target.value)}
              placeholder={previewTitle}
              maxLength={120}
            />
            <p className="mt-1 text-xs text-muted-foreground">Leave blank to use the auto title shown on the property page.</p>
            <FieldError message={state.fieldErrors?.title} />
          </div>
          <div>
            <Label htmlFor="propertyType">Property type</Label>
            <select
              id="propertyType"
              name="propertyType"
              className="min-h-11 w-full rounded-xl border border-input bg-card px-3"
              value={draft.propertyType}
              onChange={(event) => setPropertyType(event.target.value as PropertyType)}
            >
              {PROPERTY_CATALOG.map((item) => (
                <option key={item.type} value={item.type}>
                  {item.label}
                </option>
              ))}
            </select>
            <FieldError message={state.fieldErrors?.propertyType} />
          </div>
          <div>
            <Label htmlFor="bhk">BHK</Label>
            <select
              id="bhk"
              name="bhk"
              className="min-h-11 w-full rounded-xl border border-input bg-card px-3"
              value={draft.bhk}
              disabled={!usesBhk}
              onChange={(event) => updateDraft("bhk", event.target.value)}
            >
              <option value="none">Not applicable</option>
              {[1, 2, 3, 4, 5, 6].map((bhk) => (
                <option key={bhk} value={bhk}>
                  {bhk} BHK
                </option>
              ))}
            </select>
            <FieldError message={state.fieldErrors?.bhk} />
          </div>
          <div>
            <Label htmlFor="areaSqFt">Carpet / plot area (sq ft)</Label>
            <Input
              id="areaSqFt"
              name="areaSqFt"
              type="number"
              min={1}
              required
              value={draft.areaSqFt}
              onChange={(event) => updateDraft("areaSqFt", event.target.value)}
            />
            <FieldError message={state.fieldErrors?.areaSqFt} />
          </div>
          <div>
            <Label htmlFor="price">Asking price (₹)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min={1}
              required
              value={draft.price}
              onChange={(event) => updateDraft("price", event.target.value)}
            />
            <FieldError message={state.fieldErrors?.price} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">About this home</Label>
            <Textarea
              id="description"
              name="description"
              required
              rows={6}
              value={draft.description}
              onChange={(event) => updateDraft("description", event.target.value)}
              placeholder="Describe layout, condition, neighbourhood, nearby schools or markets, and anything a buyer should know before visiting."
            />
            <p className="mt-1 text-xs text-muted-foreground">{draft.description.trim().length}/40 characters minimum</p>
            <FieldError message={state.fieldErrors?.description} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="button" onClick={goNext}>
              Continue to specs
            </Button>
          </div>
        </section>

        <section hidden={step !== 1} className="grid gap-4 rounded-3xl border border-border bg-card p-5 md:grid-cols-2">
          {plotLike ? (
            <>
              <input type="hidden" name="furnishing" value="UNFURNISHED" />
              <input type="hidden" name="floor" value="" />
              <input type="hidden" name="totalFloors" value="" />
            </>
          ) : null}
          <div>
            <Label htmlFor="approvingAuthority">Approving authority</Label>
            <select
              id="approvingAuthority"
              name="approvingAuthority"
              className="min-h-11 w-full rounded-xl border border-input bg-card px-3"
              value={draft.approvingAuthority}
              onChange={(event) => updateDraft("approvingAuthority", event.target.value)}
            >
              {APPROVING_AUTHORITIES.map((authority) => (
                <option key={authority}>{authority}</option>
              ))}
            </select>
            <FieldError message={state.fieldErrors?.approvingAuthority} />
          </div>
          <div>
            <Label htmlFor="possessionStatus">Possession</Label>
            <select
              id="possessionStatus"
              name="possessionStatus"
              className="min-h-11 w-full rounded-xl border border-input bg-card px-3"
              value={draft.possessionStatus}
              onChange={(event) => updateDraft("possessionStatus", event.target.value as PossessionStatus)}
            >
              {POSSESSION_LABELS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="furnishing">Furnishing</Label>
            <select
              id="furnishing"
              name="furnishing"
              className="min-h-11 w-full rounded-xl border border-input bg-card px-3"
              value={draft.furnishing}
              disabled={plotLike}
              onChange={(event) => updateDraft("furnishing", event.target.value as Furnishing)}
            >
              {FURNISHING_LABELS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <FieldError message={state.fieldErrors?.furnishing} />
          </div>
          <div>
            <Label htmlFor="facing">Facing</Label>
            <select
              id="facing"
              name="facing"
              className="min-h-11 w-full rounded-xl border border-input bg-card px-3"
              value={draft.facing}
              onChange={(event) => updateDraft("facing", event.target.value)}
            >
              {FACING_OPTIONS.map((facing) => (
                <option key={facing}>{facing}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="floor">Floor number</Label>
            <Input
              id="floor"
              name="floor"
              type="number"
              min={0}
              value={draft.floor}
              disabled={plotLike}
              required={needsFloor}
              onChange={(event) => updateDraft("floor", event.target.value)}
            />
            <FieldError message={state.fieldErrors?.floor} />
          </div>
          <div>
            <Label htmlFor="totalFloors">Total floors in building</Label>
            <Input
              id="totalFloors"
              name="totalFloors"
              type="number"
              min={1}
              value={draft.totalFloors}
              disabled={plotLike}
              required={needsFloor}
              onChange={(event) => updateDraft("totalFloors", event.target.value)}
            />
            <FieldError message={state.fieldErrors?.totalFloors} />
          </div>
          <div>
            <Label htmlFor="ageYears">Age of property (years)</Label>
            <Input
              id="ageYears"
              name="ageYears"
              type="number"
              min={0}
              value={draft.ageYears}
              onChange={(event) => updateDraft("ageYears", event.target.value)}
            />
            <FieldError message={state.fieldErrors?.ageYears} />
          </div>
          <fieldset className="md:col-span-2">
            <legend className="mb-2 text-sm font-semibold">Amenities shown on the property page</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {AMENITIES.map((amenity) => (
                <label key={amenity} className="flex min-h-11 items-center gap-2 rounded-xl border border-transparent px-2 text-sm hover:border-border hover:bg-[#f7f9fc]">
                  <input
                    type="checkbox"
                    checked={draft.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="md:col-span-2 flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button type="button" onClick={goNext}>
              Continue to location
            </Button>
          </div>
        </section>

        <section hidden={step !== 2} className="grid gap-4 rounded-3xl border border-border bg-card p-5 md:grid-cols-2">
          <div>
            <Label htmlFor="localityId">Locality</Label>
            <select
              id="localityId"
              name="localityId"
              className="min-h-11 w-full rounded-xl border border-input bg-card px-3"
              value={draft.localityId}
              onChange={(event) => setLocality(event.target.value)}
            >
              {localities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <FieldError message={state.fieldErrors?.localityId} />
          </div>
          <div>
            <Label htmlFor="landmark">Nearby landmark</Label>
            <Input
              id="landmark"
              name="landmark"
              value={draft.landmark}
              onChange={(event) => updateDraft("landmark", event.target.value)}
              placeholder="e.g. Near Phoenix Palassio"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address">Full street address</Label>
            <Input
              id="address"
              name="address"
              required
              value={draft.address}
              onChange={(event) => updateDraft("address", event.target.value)}
              placeholder="House / flat no., street, society"
            />
            <FieldError message={state.fieldErrors?.address} />
          </div>
          <div>
            <Label htmlFor="lat">Map latitude</Label>
            <Input
              id="lat"
              name="lat"
              type="number"
              step="any"
              required
              value={draft.lat}
              onChange={(event) => updateDraft("lat", event.target.value)}
            />
            <FieldError message={state.fieldErrors?.lat} />
          </div>
          <div>
            <Label htmlFor="lng">Map longitude</Label>
            <Input
              id="lng"
              name="lng"
              type="number"
              step="any"
              required
              value={draft.lng}
              onChange={(event) => updateDraft("lng", event.target.value)}
            />
            <FieldError message={state.fieldErrors?.lng} />
          </div>
          <p className="md:col-span-2 text-sm text-muted-foreground">
            Coordinates default to the locality centre. Adjust them so the property page map pin is accurate. City: {brand.city}.
          </p>
          <div className="md:col-span-2 flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" onClick={goNext}>
              Continue to photos
            </Button>
          </div>
        </section>

        <section hidden={step !== 3} className="space-y-4 rounded-3xl border border-border bg-card p-5">
          <div>
            <Label htmlFor="photo-picker">Property photos</Label>
            <input
              id="photo-picker"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="mt-2 block w-full text-sm"
              onChange={(event) => {
                addPhotos(event.target.files);
                event.target.value = "";
              }}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Upload 2–12 photos (JPG, PNG or WebP, max 8 MB each). Stored on ImageKit. First photo becomes the cover on cards and the property page.
            </p>
            {photoError ? <p className="mt-2 text-sm text-destructive" role="alert">{photoError}</p> : null}
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {photos.map((photo, index) => (
              <li
                key={photo.id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex === null) return;
                  movePhoto(dragIndex, index);
                  setDragIndex(null);
                }}
                className="rounded-2xl border border-border p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.preview} alt={`Photo ${index + 1} preview`} className="aspect-[4/3] w-full rounded-xl object-cover" />
                <p className="mt-2 text-xs font-semibold text-muted-foreground">{index === 0 ? "Cover photo" : `Photo ${index + 1}`}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => movePhoto(index, index - 1)} aria-label={`Move photo ${index + 1} earlier`}>
                    Earlier
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => movePhoto(index, index + 1)} aria-label={`Move photo ${index + 1} later`}>
                    Later
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      URL.revokeObjectURL(photo.preview);
                      setPhotos(photos.filter((item) => item.id !== photo.id));
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button type="button" onClick={goNext}>
              Continue to papers
            </Button>
          </div>
        </section>

        <section hidden={step !== 4} className="space-y-4 rounded-3xl border border-border bg-card p-5">
          <div>
            <Label htmlFor="document-picker">Ownership / approval documents</Label>
            <input
              id="document-picker"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              className="mt-2 block w-full text-sm"
              onChange={(event) => {
                addDocuments(event.target.files);
                event.target.value = "";
              }}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Attach registry papers, RERA, sanction plan or authority approval (JPG, PNG, WebP or PDF). Staff only — buyers never see these files.
            </p>
            {docError ? <p className="mt-2 text-sm text-destructive" role="alert">{docError}</p> : null}
          </div>
          <ul className="space-y-2">
            {documents.map((doc, index) => (
              <li key={`${doc.name}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-3 py-2 text-sm">
                <span className="truncate">{doc.name}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setDocuments(documents.filter((_, i) => i !== index))}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button type="button" onClick={goNext}>
              Review listing
            </Button>
          </div>
        </section>

        <section hidden={step !== 5} className="space-y-4 rounded-3xl border border-border bg-card p-5">
          <h2 className="font-heading text-2xl">Review before submit</h2>
          <p className="text-sm text-muted-foreground">
            This is exactly what inspectors and, after verification, buyers will rely on. Photos upload to ImageKit. The listing stays private until the NestVerify audit passes.
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</dt>
              <dd className="mt-1 text-sm font-semibold">{previewTitle}</dd>
            </div>
            <div className="rounded-2xl border border-border p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price</dt>
              <dd className="mt-1 text-sm font-semibold">{priceNumber > 0 ? formatPriceINR(priceNumber) : "—"}</dd>
            </div>
            <div className="rounded-2xl border border-border p-3 sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</dt>
              <dd className="mt-1 text-sm font-semibold">
                {draft.address || "—"}
                {draft.landmark ? ` (Near ${draft.landmark})` : ""}
                {locality ? ` · ${locality.name}` : ""}
              </dd>
            </div>
            <div className="rounded-2xl border border-border p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Photos</dt>
              <dd className="mt-1 text-sm font-semibold">{photos.length} ready</dd>
            </div>
            <div className="rounded-2xl border border-border p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documents</dt>
              <dd className="mt-1 text-sm font-semibold">{documents.length} attached</dd>
            </div>
          </dl>
          {state.error ? (
            <p className="rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(4)}>
              Back
            </Button>
            <Submit />
          </div>
        </section>
      </div>

      <aside className="h-fit space-y-4 lg:sticky lg:top-24">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Property page preview</p>
          <div className="mt-3 overflow-hidden rounded-2xl bg-secondary">
            {photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photos[0].preview} alt="Cover preview" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">Cover photo appears here</div>
            )}
          </div>
          <p className="mt-3 text-sm font-semibold text-muted-foreground">
            {locality?.name ?? "Locality"}, {brand.city}
          </p>
          <h2 className="mt-1 font-heading text-2xl leading-tight">{previewTitle}</h2>
          <p className="mt-2 font-heading text-3xl">{priceNumber > 0 ? formatPriceINR(priceNumber) : "₹—"}</p>
          <p className="text-sm text-muted-foreground">
            {areaNumber > 0 ? formatArea(areaNumber) : "Area"} · {pricePerSqFt > 0 ? formatPerSqFt(pricePerSqFt) : "₹— / sq ft"}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2">
            {previewFacts.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border p-2">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-xs font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          {draft.amenities.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {draft.amenities.map((amenity) => (
                <li key={amenity} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium">
                  {amenity}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">Amenities you tick will show as chips on the property page.</p>
          )}
          {draft.description.trim() ? (
            <p className="mt-4 line-clamp-5 whitespace-pre-line text-xs leading-5 text-muted-foreground">{draft.description}</p>
          ) : null}
        </div>
      </aside>
    </form>
  );
}
