import { createHash, createHmac, randomInt, timingSafeEqual } from "crypto";
import { normalizeEmail, normalizePhone } from "@/lib/contact";
import { connectDB } from "@/lib/db";
import { OtpChallengeModel } from "@/models";

export { normalizeEmail, normalizePhone };

export type OtpPurpose = "LOGIN" | "ENQUIRY";

function appSecret(): string {
  const value = process.env.NEXTAUTH_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV !== "production") return "dev-only-nestverify-secret";
  throw new Error("NEXTAUTH_SECRET is required");
}

function hashCode(purpose: OtpPurpose, target: string, code: string): string {
  return createHash("sha256").update(`${purpose}:${target}:${code}`).digest("hex");
}

export async function issueOtp(target: string, purpose: OtpPurpose): Promise<{ devCode: string | null; delivered: boolean }> {
  await connectDB();
  const code = String(randomInt(100000, 999999));
  const codeHash = hashCode(purpose, target, code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await OtpChallengeModel().deleteMany({ target, purpose, consumedAt: null });
  await OtpChallengeModel().create({ target, purpose, codeHash, expiresAt, attempts: 0, consumedAt: null });
  const delivered = await deliverOtp(target, code, purpose);
  const showDevCode = process.env.NODE_ENV !== "production";
  if (showDevCode) {
    console.info(`NestVerify ${purpose} code for ${target}: ${code}`);
  }
  return { devCode: showDevCode ? code : null, delivered };
}

async function deliverOtp(target: string, code: string, purpose: OtpPurpose): Promise<boolean> {
  const webhook = process.env.OTP_WEBHOOK_URL;
  if (!webhook) return process.env.NODE_ENV !== "production";
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, code, purpose }),
  });
  return response.ok;
}

export async function consumeOtp(target: string, purpose: OtpPurpose, code: string): Promise<boolean> {
  await connectDB();
  const challenge = await OtpChallengeModel()
    .findOne({ target, purpose, consumedAt: null, expiresAt: { $gt: new Date() } })
    .sort({ createdAt: -1 });
  if (!challenge) return false;
  if (challenge.attempts >= 5) return false;
  const actual = hashCode(purpose, target, code.trim());
  const expected = challenge.codeHash;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  const matches = actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  if (!matches) {
    challenge.attempts += 1;
    await challenge.save();
    return false;
  }
  challenge.consumedAt = new Date();
  await challenge.save();
  return true;
}

export function signEnquiryProof(phone: string): string {
  const exp = Date.now() + 15 * 60 * 1000;
  const payload = `${phone}.${exp}`;
  const signature = createHmac("sha256", appSecret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyEnquiryProof(token: string, phone: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [tokenPhone, expText, signature] = parts;
  if (!tokenPhone || !expText || !signature) return false;
  if (tokenPhone !== phone) return false;
  const exp = Number(expText);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const payload = `${tokenPhone}.${expText}`;
  const expected = createHmac("sha256", appSecret()).update(payload).digest("hex");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}
