import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/auth", "/_next", "/api", "/favicon.ico", "/assets", "/public"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public files and API routes
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Get session token (works for both JWT and session cookies)
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Redirect root (/) to /auth if not authenticated
  if (pathname === "/" && !token) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Prevent logged-in users from accessing /auth
  if (pathname.startsWith("/auth") && token) {
    // Redirect based on role
    if (token.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } else if (token.role === "MAIN_RESIDENT" || token.role === "DEPENDANT") {
      return NextResponse.redirect(new URL("/resident/dashboard", request.url));
    } else if (token.role === "ESTATE_GUARD") {
      return NextResponse.redirect(new URL("/estate-guard/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|assets|public).*)"],
};
