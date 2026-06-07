import { type NextRequest, NextResponse } from "next/server";

const AUTH_ROUTES = ["/login", "/register", "/verify-email"];
const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/orders",
  "/invoices",
  "/deployments",
  "/tickets",
  "/settings",
  "/beta-access",
  "/admin",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // NOTE: Laravel's session cookie (jadenode_session) is set for ALL visitors
  // including unauthenticated guests, so it cannot be used as an auth signal.
  // Redirecting authenticated users away from /login is handled client-side
  // in the login page via getSession().
  //
  // For protected routes we still do a lightweight cookie check as a first-pass
  // UX guard (catches completely fresh browsers with no cookies at all).
  // The backend enforces real auth — 401 responses drive the actual redirect.
  const sessionCookie = request.cookies.get("jadenode_session")?.value;
  const mightBeAuthenticated = !!sessionCookie;

  // Protected pages: redirect to login only when there is definitely no session.
  if (PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (!mightBeAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
