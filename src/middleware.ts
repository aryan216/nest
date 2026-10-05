import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";
import type { UserRole } from "@/types/domain";

export default withAuth(
  function middleware(request: NextRequest & { nextauth: { token: { role?: UserRole } | null } }) {
    const role = request.nextauth.token?.role;
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith("/admin") && role !== "ADMIN" && role !== "INSPECTOR") {
      return NextResponse.redirect(new URL("/login?callbackUrl=/admin", request.url));
    }
    if (pathname.startsWith("/partner") && role !== "PARTNER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login?callbackUrl=/partner", request.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/partner/:path*"],
};
