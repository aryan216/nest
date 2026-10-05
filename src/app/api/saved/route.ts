import { NextResponse } from "next/server";
import { assertSameOrigin, OriginError } from "@/lib/origin";
import { requireApiUser } from "@/lib/session";
import { listSavedIds, setSaved, syncSaved } from "@/services/quality";
import { savedSyncSchema, savedToggleSchema } from "@/validations/schemas";

export async function GET() {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ ids: [] });
  const ids = await listSavedIds(user.id);
  return NextResponse.json({ ids });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    if (error instanceof OriginError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw error;
  }
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const json: unknown = await request.json().catch(() => null);
  const parsed = savedToggleSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid listing." }, { status: 400 });
  await setSaved(user.id, parsed.data.listingId, parsed.data.saved);
  const ids = await listSavedIds(user.id);
  return NextResponse.json({ ids });
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    if (error instanceof OriginError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw error;
  }
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const json: unknown = await request.json().catch(() => null);
  const parsed = savedSyncSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid list." }, { status: 400 });
  const ids = await syncSaved(user.id, parsed.data.ids);
  return NextResponse.json({ ids });
}
