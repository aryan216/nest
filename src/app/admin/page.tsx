import Link from "next/link";
import { formatPriceINR } from "@/lib/format";
import { listingStatusLabel } from "@/config/catalog";
import { listReviewQueue } from "@/services/verification";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const queue = await listReviewQueue();
  return (
    <div>
      <h1 className="font-heading text-3xl">Review queue</h1>
      <p className="mt-2 text-sm text-muted-foreground">Homes waiting for an in-person checklist. Nothing here is public.</p>
      {queue.length === 0 ? <p className="mt-6 text-sm">The queue is clear.</p> : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-border">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Listings waiting for verification</caption>
            <thead className="bg-secondary">
              <tr>
                <th scope="col" className="px-4 py-3">Home</th>
                <th scope="col" className="px-4 py-3">Locality</th>
                <th scope="col" className="px-4 py-3">Price</th>
                <th scope="col" className="px-4 py-3">Photos</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Open</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((listing) => (
                <tr key={listing.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{listing.title}</td>
                  <td className="px-4 py-3">{listing.localityName}</td>
                  <td className="px-4 py-3">{formatPriceINR(listing.price)}</td>
                  <td className="px-4 py-3">{listing.imageCount}</td>
                  <td className="px-4 py-3">{listingStatusLabel(listing.status)}</td>
                  <td className="px-4 py-3"><Link className="font-semibold underline-offset-4 hover:underline" href={`/admin/listings/${listing.id}`}>Review listing</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
