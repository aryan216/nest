import Link from "next/link";
import { submitEnquiryUpdate } from "@/actions/market";
import { ENQUIRY_STATUSES, isOneOf, type EnquiryStatus } from "@/types/domain";
import { formatDate } from "@/lib/format";
import { listEnquiries } from "@/services/partners";

export const dynamic = "force-dynamic";

export default async function EnquiriesPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status && isOneOf(searchParams.status, ENQUIRY_STATUSES) ? searchParams.status : undefined;
  const records = await listEnquiries(status as EnquiryStatus | undefined);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl">Enquiries</h1>
        <a className="inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline" href={status ? `/api/admin/enquiries/export?status=${status}` : "/api/admin/enquiries/export"}>
          Download enquiries as CSV
        </a>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/enquiries" className="inline-flex min-h-11 items-center rounded-full bg-secondary px-3">All</Link>
        {ENQUIRY_STATUSES.map((item) => (
          <Link key={item} href={`/admin/enquiries?status=${item}`} className="inline-flex min-h-11 items-center rounded-full bg-secondary px-3">{item.replaceAll("_", " ")}</Link>
        ))}
      </div>
      <div className="mt-4 space-y-4">
        {records.length === 0 ? <p className="text-sm">No enquiries in this view.</p> : null}
        {records.map((record) => (
          <form key={record.id} action={submitEnquiryUpdate} className="rounded-3xl border border-border bg-card p-4">
            <input type="hidden" name="enquiryId" value={record.id} />
            <p className="font-semibold">{record.name} · {record.phone}</p>
            <p className="text-sm text-muted-foreground">{record.listingTitle} · {record.preferredTime} · {formatDate(record.createdAt)}</p>
            {record.message ? <p className="mt-2 text-sm">{record.message}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="text-sm font-semibold">
                Status
                <select name="status" defaultValue={record.status} className="ml-2 min-h-11 rounded-xl border border-input bg-card px-3">
                  {ENQUIRY_STATUSES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
                </select>
              </label>
              <label className="min-w-48 flex-1 text-sm font-semibold">
                Notes
                <input name="notes" defaultValue={record.notes} className="mt-1 min-h-11 w-full rounded-xl border border-input bg-card px-3" />
              </label>
              <button type="submit" className="min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">Update enquiry</button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
