import Link from "next/link";
import { getQualityReport } from "@/services/quality";

export const dynamic = "force-dynamic";

export default async function QualityPage() {
  const warnings = await getQualityReport();
  return (
    <div>
      <h1 className="font-heading text-3xl">Data quality</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Warnings for unlikely BHK and area pairs, shared photos, missing fields, and titles that do not match their source fields.
      </p>
      {warnings.length === 0 ? <p className="mt-6 text-sm">No warnings right now.</p> : (
        <ul className="mt-6 space-y-3">
          {warnings.map((warning, index) => (
            <li key={`${warning.listingId}-${warning.code}-${index}`} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{warning.code.replaceAll("_", " ")}</p>
              <p className="mt-1 font-semibold">{warning.listingTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">{warning.message}</p>
              <Link href={`/admin/listings/${warning.listingId}`} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:underline">
                Open listing
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
