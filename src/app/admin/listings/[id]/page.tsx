import { notFound } from "next/navigation";
import { ListingPhoto } from "@/components/property/listing-photo";
import { ReviewForms } from "@/components/admin/review-forms";
import { formatArea, formatPriceINR } from "@/lib/format";
import { getStaffListing } from "@/services/verification";

export const dynamic = "force-dynamic";

export default async function ReviewListingPage({ params }: { params: { id: string } }) {
  const listing = await getStaffListing(params.id);
  if (!listing) notFound();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">{listing.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{listing.localityName} · {formatArea(listing.areaSqFt)} · {formatPriceINR(listing.price)} · {listing.approvingAuthority}</p>
        <p className="mt-3 max-w-3xl text-sm leading-6">{listing.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {listing.images.map((image) => (
          <div key={image.url} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
            <ListingPhoto src={image.url} alt={image.alt} sizes="30vw" />
          </div>
        ))}
      </div>
      {listing.documents.length > 0 ? (
        <ul className="text-sm">
          {listing.documents.map((document) => (
            <li key={document.url}>
              <a className="font-semibold underline-offset-4 hover:underline" href={document.url}>{document.name}</a>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-destructive">No document is attached.</p>}
      <ReviewForms listingId={listing.id} />
    </div>
  );
}
