import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpFromHeaders } from "@/lib/origin";
import { getListingsByIds } from "@/services/listings";

export async function GET(request: Request) {
  const ip = clientIpFromHeaders(request.headers);
  const limit = rateLimit(`summaries:${ip}`, 60, 60 * 1000);
  if (!limit.ok) return NextResponse.json({ listings: [] }, { status: 429 });
  const url = new URL(request.url);
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^[a-f0-9]{24}$/i.test(id))
    .slice(0, 30);
  const listings = await getListingsByIds(ids);
  return NextResponse.json({ listings });
}
