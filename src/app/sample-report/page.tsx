import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/config/brand";
import { VerificationSummary } from "@/components/property/verification-summary";

export const metadata: Metadata = {
  title: "Sample verification report",
  description: `A sample of the checklist ${brand.name} attaches to a verified home in ${brand.city}. This is not a live listing.`,
  alternates: { canonical: "/sample-report" },
};

export default function SampleReportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground">Sample only. This is not a live listing and it is not for sale.</p>
      <h1 className="mt-6 font-heading text-4xl">How a verification report reads</h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        Every public home on {brand.name} carries a checklist like this. The sample below uses a made-up address in {brand.city} so you can see the shape before you enquire.
      </p>
      <div className="mt-6">
        <VerificationSummary
          sample
          verifiedAt="2026-03-12T00:00:00.000Z"
          notes="Sample note: the inspector measured the carpet area at 1,184 sq ft and matched the LDA sanction letter to the site."
          checklist={{
            photosMatch: true,
            addressConfirmed: true,
            areaMeasured: true,
            ownershipDocsSeen: true,
            authorityApprovalChecked: true,
          }}
        />
      </div>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline">
        Back to verified homes
      </Link>
    </div>
  );
}
