"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { brand } from "@/config/brand";
import { submitPartnerApplication, type ActionState } from "@/actions/market";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initial: ActionState = { ok: false };

function Submit() {
  const status = useFormStatus();
  return <Button type="submit" disabled={status.pending}>{status.pending ? "Sending" : "Submit application"}</Button>;
}

export function PartnerApplicationForm() {
  const [state, action] = useFormState(submitPartnerApplication, initial);
  const router = useRouter();
  useEffect(() => {
    if (state.ok) router.push("/join/thank-you");
  }, [state.ok, router]);

  return (
    <form action={action} className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div>
        <Label htmlFor="partner-name">Name</Label>
        <Input id="partner-name" name="name" required autoComplete="name" />
        {state.fieldErrors?.name ? <p className="mt-1 text-sm text-destructive">{state.fieldErrors.name}</p> : null}
      </div>
      <div>
        <Label htmlFor="partner-phone">Mobile</Label>
        <Input id="partner-phone" name="phone" required inputMode="numeric" autoComplete="tel" />
        {state.fieldErrors?.phone ? <p className="mt-1 text-sm text-destructive">{state.fieldErrors.phone}</p> : null}
      </div>
      <div>
        <Label htmlFor="partner-email">Email</Label>
        <Input id="partner-email" name="email" type="email" required autoComplete="email" />
        {state.fieldErrors?.email ? <p className="mt-1 text-sm text-destructive">{state.fieldErrors.email}</p> : null}
      </div>
      <div>
        <Label htmlFor="partner-city">City you work in</Label>
        <Input id="partner-city" name="city" required defaultValue={brand.city} />
      </div>
      <div>
        <Label htmlFor="partner-experience">Experience</Label>
        <Input id="partner-experience" name="experience" required placeholder="For example, 6 years selling homes in Gomti Nagar" />
        {state.fieldErrors?.experience ? <p className="mt-1 text-sm text-destructive">{state.fieldErrors.experience}</p> : null}
      </div>
      <div>
        <Label htmlFor="partner-about">About the homes you handle</Label>
        <Textarea id="partner-about" name="about" required />
        {state.fieldErrors?.about ? <p className="mt-1 text-sm text-destructive">{state.fieldErrors.about}</p> : null}
      </div>
      {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
      <Submit />
    </form>
  );
}
