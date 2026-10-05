import { Check } from "lucide-react";
import { formatDate } from "@/lib/format";

const ITEMS = [
  { key: "photosMatch", label: "Photos match the property" },
  { key: "addressConfirmed", label: "Address confirmed on site" },
  { key: "areaMeasured", label: "Area measured" },
  { key: "ownershipDocsSeen", label: "Ownership documents seen" },
  { key: "authorityApprovalChecked", label: "Approving authority checked" },
] as const;

export function VerificationSummary({
  verifiedAt,
  notes,
  checklist,
  sample = false,
}: {
  verifiedAt: string;
  notes: string;
  checklist: Record<(typeof ITEMS)[number]["key"], boolean>;
  sample?: boolean;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-soft" aria-labelledby="verification-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="verification-heading" className="font-heading text-2xl">
            {sample ? "Sample verification summary" : "Verification summary"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Inspected in person · {formatDate(verifiedAt)}</p>
        </div>
        <span className="rounded-full bg-verified px-3 py-1 text-xs font-semibold text-verified-foreground">Verified</span>
      </div>
      <ul className="mt-5 space-y-3">
        {ITEMS.map((item) => (
          <li key={item.key} className="flex items-center gap-3 text-sm">
            <span className={checklist[item.key] ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-verified text-verified-foreground" : "inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted"}>
              {checklist[item.key] ? <Check className="h-4 w-4" aria-hidden /> : null}
            </span>
            <span>
              {item.label}
              <span className="sr-only">{checklist[item.key] ? ", passed" : ", not passed"}</span>
            </span>
          </li>
        ))}
      </ul>
      {notes ? <p className="mt-5 text-sm leading-6 text-muted-foreground">{notes}</p> : null}
    </section>
  );
}
