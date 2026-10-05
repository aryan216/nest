import Link from "next/link";
import { ListingWizard } from "@/components/partner/listing-wizard";
import { requireUser } from "@/lib/session";
import { listLiveLocalities } from "@/services/verification";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  await requireUser(["PARTNER", "ADMIN"]);
  const localities = await listLiveLocalities();
  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#4673eb]">
            <Link href="/partner" className="hover:underline">
              Partner desk
            </Link>{" "}
            / New listing
          </p>
          <h1 className="mt-1 font-heading text-4xl">Register a property</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Capture every detail shown on the public property page — type, price, area, authority, possession, furnishing, floor, facing, age, BHK, amenities, description, map location, gallery photos and ownership papers. Photos are stored on ImageKit.
          </p>
        </div>
        <Link href="/partner" className="inline-flex min-h-11 items-center text-sm font-semibold text-[#4d5a83] hover:text-[#4574ec]">
          Back to desk
        </Link>
      </div>
      <div className="mt-2">
        {localities.length === 0 ? <p>Localities are not ready yet. Seed the database first.</p> : <ListingWizard localities={localities} />}
      </div>
    </div>
  );
}
