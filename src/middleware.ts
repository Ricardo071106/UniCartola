import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "campus_league_session";

const AUTH_PAGES = ["/login", "/cadastro", "/onboarding"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api") || AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (pathname.startsWith("/perfil") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
