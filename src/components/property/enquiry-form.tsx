"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { brand } from "@/config/brand";
import { PREFERRED_TIMES } from "@/types/domain";
import { submitEnquiry, type ActionState } from "@/actions/market";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isRecord } from "@/lib/utils";

const initial: ActionState = { ok: false };

function SubmitButton({ ready }: { ready: boolean }) {
  const status = useFormStatus();
  return (
    <Button type="submit" disabled={!ready || status.pending}>
      {status.pending ? "Sending" : "Send enquiry"}
    </Button>
  );
}

export function EnquiryForm({ listingId }: { listingId: string }) {
  const [state, action] = useFormState(submitEnquiry, initial);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [proof, setProof] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function sendCode() {
    setNote("");
    const response = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "ENQUIRY", target: phone }),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      setNote(isRecord(payload) && typeof payload.error === "string" ? payload.error : "Could not send a code.");
      return;
    }
    setDevCode(isRecord(payload) && typeof payload.devCode === "string" ? payload.devCode : null);
    setNote("Enter the 6-digit code we sent to confirm this number.");
  }

  async function confirmCode() {
    setNote("");
    const response = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok || !isRecord(payload) || typeof payload.proof !== "string") {
      setNote(isRecord(payload) && typeof payload.error === "string" ? payload.error : "That code did not match.");
      return;
    }
    setProof(payload.proof);
    setNote("Number confirmed. You can send the enquiry.");
  }

  if (state.ok) {
    return <p className="rounded-2xl bg-secondary p-4 text-sm" role="status">Enquiry received. A {brand.name} coordinator will call you. Your number stays with us.</p>;
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="proof" value={proof} />
      <p className="rounded-2xl bg-secondary px-3 py-3 text-sm leading-6">
        Your number is shared only with {brand.name}, never with owners or agents.
      </p>
      <div>
        <Label htmlFor="enquiry-name">Name</Label>
        <Input id="enquiry-name" name="name" autoComplete="name" required />
        {state.fieldErrors?.name ? <p className="mt-1 text-sm text-destructive">{state.fieldErrors.name}</p> : null}
      </div>
      <div>
        <Label htmlFor="enquiry-phone">Mobile number</Label>
        <div className="flex gap-2">
          <Input id="enquiry-phone" name="phone" inputMode="numeric" autoComplete="tel" value={phone} onChange={(event) => { setPhone(event.target.value); setProof(""); }} required />
          <Button type="button" variant="outline" onClick={() => void sendCode()}>Send code</Button>
        </div>
        {state.fieldErrors?.phone ? <p className="mt-1 text-sm text-destructive">{state.fieldErrors.phone}</p> : null}
      </div>
      <div>
        <Label htmlFor="enquiry-code">Confirmation code</Label>
        <div className="flex gap-2">
          <Input id="enquiry-code" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} aria-describedby="otp-note" />
          <Button type="button" variant="secondary" onClick={() => void confirmCode()}>Confirm number</Button>
        </div>
        {devCode ? <p className="mt-2 text-sm">Development code: {devCode}</p> : null}
      </div>
      <div>
        <Label htmlFor="preferred-time">Preferred time</Label>
        <select id="preferred-time" name="preferredTime" className="min-h-11 w-full rounded-xl border border-input bg-card px-3" defaultValue="Anytime">
          {PREFERRED_TIMES.map((time) => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="enquiry-message">Message</Label>
        <Textarea id="enquiry-message" name="message" placeholder="Tell us what you want to check on the visit" />
      </div>
      {note ? <p id="otp-note" className="text-sm" role="status">{note}</p> : null}
      {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
      <SubmitButton ready={Boolean(proof)} />
    </form>
  );
}
