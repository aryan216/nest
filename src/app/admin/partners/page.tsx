import { submitPartnerDecision } from "@/actions/market";
import { PARTNER_APPLICATION_STATUSES } from "@/types/domain";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { listPartnerApplications } from "@/services/partners";

export const dynamic = "force-dynamic";

export default async function PartnerApplicationsPage() {
  await requireUser(["ADMIN"]);
  const applications = await listPartnerApplications();
  return (
    <div>
      <h1 className="font-heading text-3xl">Partner applications</h1>
      <p className="mt-2 text-sm text-muted-foreground">Approving an application creates a partner login for that email if one does not exist.</p>
      <div className="mt-6 space-y-4">
        {applications.length === 0 ? <p className="text-sm">No applications yet.</p> : null}
        {applications.map((application) => (
          <form key={application.id} action={submitPartnerDecision} className="rounded-3xl border border-border bg-card p-4">
            <input type="hidden" name="applicationId" value={application.id} />
            <p className="font-semibold">{application.name}</p>
            <p className="text-sm text-muted-foreground">{application.email} · {application.phone} · {application.city} · {formatDate(application.createdAt)}</p>
            <p className="mt-2 text-sm">{application.experience}</p>
            <p className="mt-2 text-sm leading-6">{application.about}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <select name="status" defaultValue={application.status} className="min-h-11 rounded-xl border border-input bg-card px-3">
                {PARTNER_APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <button type="submit" className="min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">Save decision</button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
