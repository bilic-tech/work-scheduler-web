import { NextResponse, type NextRequest } from "next/server";

import {
  parseSessionCookies,
  ROLE_COOKIE,
  SESSION_COOKIE,
  TWO_FACTOR_COOKIE,
} from "@/lib/auth/cookies";
import { canAccessPath, ROLE_HOME } from "@/lib/rbac";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/requests",
  "/team-calendar",
  "/reports",
  "/team",
];

const AUTH_PAGES = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-2fa",
  "/",
]);

function redirectToLogin(request: NextRequest, pathname: string) {
  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthPage = AUTH_PAGES.has(pathname);

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const roleCookie = request.cookies.get(ROLE_COOKIE)?.value;
  const pendingTwoFactor = request.cookies.get(TWO_FACTOR_COOKIE)?.value;
  const session = sessionToken
    ? await parseSessionCookies(sessionToken, roleCookie)
    : null;

  if (isProtected) {
    if (session) {
      if (!canAccessPath(session.role, pathname)) {
        return redirectTo(request, ROLE_HOME);
      }
    } else if (sessionToken) {
      return NextResponse.next({
        request: {
          headers: withPathname(request, pathname),
        },
      });
    } else if (pendingTwoFactor) {
      return redirectTo(request, "/verify-2fa");
    } else {
      return redirectToLogin(request, pathname);
    }
  }

  if (session && isAuthPage) {
    return redirectTo(request, ROLE_HOME);
  }

  if (pathname === "/verify-2fa" && !pendingTwoFactor) {
    return redirectTo(request, "/login");
  }

  return NextResponse.next({
    request: { headers: withPathname(request, pathname) },
  });
}

function withPathname(request: NextRequest, pathname: string) {
  const headers = new Headers(request.headers);
  headers.set("x-leavewise-pathname", pathname);
  return headers;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
