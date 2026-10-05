import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/session";
import { enquiriesToCsv, listEnquiries } from "@/services/partners";
import { isOneOf, ENQUIRY_STATUSES, type EnquiryStatus } from "@/types/domain";

export async function GET(request: Request) {
  const user = await requireApiUser(["ADMIN", "INSPECTOR"]);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const statusParam = new URL(request.url).searchParams.get("status");
  const status = statusParam && isOneOf(statusParam, ENQUIRY_STATUSES) ? statusParam : undefined;
  const records = await listEnquiries(status as EnquiryStatus | undefined);
  const csv = enquiriesToCsv(records);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=nestverify-enquiries.csv",
    },
  });
}
