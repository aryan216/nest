import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, clientIpFromHeaders, OriginError } from "@/lib/origin";
import { issueOtp, normalizeEmail } from "@/lib/otp";
import { rateLimit } from "@/lib/rate-limit";
import { emailSchema, phoneSchema } from "@/validations/schemas";

const bodySchema = z.object({
  purpose: z.enum(["LOGIN", "ENQUIRY"]),
  target: z.string().trim().min(3).max(160),
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
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email or mobile number." }, { status: 400 });
  const ip = clientIpFromHeaders(request.headers);
  const ipLimit = rateLimit(`otp-ip:${ip}`, 20, 15 * 60 * 1000);
  if (!ipLimit.ok) return NextResponse.json({ error: "Too many codes requested. Try again shortly." }, { status: 429 });

  let target = "";
  if (parsed.data.purpose === "LOGIN") {
    const email = emailSchema.safeParse(parsed.data.target);
    if (!email.success) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    target = normalizeEmail(email.data);
  } else {
    const phone = phoneSchema.safeParse(parsed.data.target);
    if (!phone.success) return NextResponse.json({ error: "Enter a 10-digit Indian mobile number." }, { status: 400 });
    target = phone.data;
  }
  const targetLimit = rateLimit(`otp:${parsed.data.purpose}:${target}`, 5, 15 * 60 * 1000);
  if (!targetLimit.ok) return NextResponse.json({ error: "Too many codes for this contact. Try again shortly." }, { status: 429 });
  const issued = await issueOtp(target, parsed.data.purpose);
  if (!issued.delivered && !issued.devCode) {
    return NextResponse.json({ error: "Number and email codes are not configured on this server yet." }, { status: 503 });
  }
  return NextResponse.json({ ok: true, devCode: issued.devCode });
}
