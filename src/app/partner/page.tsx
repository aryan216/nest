import Link from "next/link";
import { requireUser } from "@/lib/session";
import { formatDate, formatPriceINR } from "@/lib/format";
import { listingStatusLabel } from "@/config/catalog";
import { listPartnerListings } from "@/services/partners";

export const dynamic = "force-dynamic";

export default async function PartnerHomePage({ searchParams }: { searchParams: { submitted?: string } }) {
  const user = await requireUser(["PARTNER", "ADMIN"]);
  const listings = await listPartnerListings(user.id);
  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl">Partner desk</h1>
          <p className="mt-2 text-sm text-muted-foreground">Homes stay private until an inspector marks them verified.</p>
        </div>
        <Link href="/partner/listings/new" className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
          Register property
        </Link>
      </div>
      {searchParams.submitted ? <p className="mt-4 rounded-2xl bg-secondary p-3 text-sm" role="status">Listing submitted for inspection.</p> : null}
      <div className="mt-6 overflow-x-auto rounded-3xl border border-border">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <caption className="sr-only">Your listings</caption>
          <thead className="bg-secondary">
            <tr>
              <th scope="col" className="px-4 py-3">Home</th>
              <th scope="col" className="px-4 py-3">Locality</th>
              <th scope="col" className="px-4 py-3">Price</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {listings.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-muted-foreground">No listings yet.</td></tr>
            ) : listings.map((listing) => (
              <tr key={listing.id} className="border-t border-border">
                <td className="px-4 py-3">
                  {listing.status === "VERIFIED" ? <Link className="font-semibold underline-offset-4 hover:underline" href={`/property/${listing.slug}`}>{listing.title}</Link> : listing.title}
                  {listing.rejectionReason ? <p className="mt-1 text-destructive">{listing.rejectionReason}</p> : null}
                </td>
                <td className="px-4 py-3">{listing.localityName}</td>
                <td className="px-4 py-3">{formatPriceINR(listing.price)}</td>
                <td className="px-4 py-3">{listingStatusLabel(listing.status)}</td>
                <td className="px-4 py-3">{formatDate(listing.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
