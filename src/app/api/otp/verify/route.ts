import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, OriginError } from "@/lib/origin";
import { consumeOtp, signEnquiryProof } from "@/lib/otp";
import { phoneSchema } from "@/validations/schemas";

const bodySchema = z.object({
  phone: z.string(),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    if (error instanceof OriginError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw error;
  }
  const json: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
  const phone = phoneSchema.safeParse(parsed.data.phone);
  if (!phone.success) return NextResponse.json({ error: "Enter a 10-digit Indian mobile number." }, { status: 400 });
  const ok = await consumeOtp(phone.data, "ENQUIRY", parsed.data.code);
  if (!ok) return NextResponse.json({ error: "That code is not valid any more." }, { status: 400 });
  return NextResponse.json({ proof: signEnquiryProof(phone.data) });
}
