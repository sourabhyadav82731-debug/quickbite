import { NextRequest, NextResponse } from "next/server";

const PORTAL_ROLES: Record<string, string> = {
  "/customer": "customer",
  "/restaurant": "restaurant_owner",
  "/delivery": "delivery_partner",
  "/admin": "admin",
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const prefix = Object.keys(PORTAL_ROLES).find((p) => pathname.startsWith(p));
  if (!prefix) return NextResponse.next();

  const role = req.cookies.get("qb_role")?.value;
  if (role !== PORTAL_ROLES[prefix]) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/customer/:path*", "/restaurant/:path*", "/delivery/:path*", "/admin/:path*"],
};
