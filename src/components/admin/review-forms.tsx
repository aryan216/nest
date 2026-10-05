"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitApproval, submitRejection, type ActionState } from "@/actions/market";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initial: ActionState = { ok: false };

const checks = [
  ["photosMatch", "Photos match the property"],
  ["addressConfirmed", "Address confirmed"],
  ["areaMeasured", "Area measured"],
  ["ownershipDocsSeen", "Ownership documents seen"],
  ["authorityApprovalChecked", "Approving authority checked"],
] as const;

function ApproveButton() {
  const status = useFormStatus();
  return <Button type="submit" disabled={status.pending}>{status.pending ? "Saving" : "Approve and publish"}</Button>;
}

export function ReviewForms({ listingId }: { listingId: string }) {
  const [approval, approve] = useFormState(submitApproval, initial);
  const [rejection, reject] = useFormState(submitRejection, initial);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={approve} className="space-y-3 rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Inspection checklist</h2>
        <input type="hidden" name="listingId" value={listingId} />
        {checks.map(([name, label]) => (
          <label key={name} className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" name={name} />
            {label}
          </label>
        ))}
        <div>
          <Label htmlFor="notes">Notes for the public summary</Label>
          <Textarea id="notes" name="notes" />
        </div>
        <div>
          <Label htmlFor="inspectionPhotos">Inspection photos</Label>
          <input id="inspectionPhotos" name="inspectionPhotos" type="file" accept="image/jpeg,image/png,image/webp" multiple />
        </div>
        {approval.error ? <p className="text-sm text-destructive" role="alert">{approval.error}</p> : null}
        {approval.ok ? <p className="text-sm" role="status">This home is now public and marked Verified.</p> : null}
        <ApproveButton />
      </form>
      <form action={reject} className="space-y-3 rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Send back</h2>
        <input type="hidden" name="listingId" value={listingId} />
        <div>
          <Label htmlFor="reason">Reason</Label>
          <Textarea id="reason" name="reason" required />
        </div>
        {rejection.error ? <p className="text-sm text-destructive" role="alert">{rejection.error}</p> : null}
        {rejection.ok ? <p className="text-sm" role="status">Listing rejected. The partner can see the reason.</p> : null}
        <Button type="submit" variant="outline">Reject listing</Button>
      </form>
    </div>
  );
}
