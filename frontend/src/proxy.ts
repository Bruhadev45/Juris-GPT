import { NextRequest, NextResponse } from "next/server";

// Auth gate for protected routes. Next.js 16 renamed `middleware.ts` →
// `proxy.ts`; the file shape and exports are otherwise identical.
//
// We can't read localStorage on the edge, so the proxy uses a marker cookie
// that the auth context (auth-context.tsx) syncs whenever the access token
// changes. This is a SOFT gate for UX: the backend is the actual authority
// via Authorization header + JWT verification.

const MARKER_COOKIE = "jurisgpt_session_active";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/agreements"];

const PUBLIC_AUTH_ROUTES = ["/login", "/signup"];

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthed = request.cookies.get(MARKER_COOKIE)?.value === "1";

  // Authenticated users hitting /login or /signup go to the dashboard.
  if (isAuthed && PUBLIC_AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Unauthenticated users hitting protected areas get bounced to /login.
  if (!isAuthed && startsWithAny(pathname, PROTECTED_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every route except static assets and Next.js internals.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|json|woff2?|ttf)).*)",
  ],
};
