// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Protect routes by default. Public routes are explicitly listed.
 * Adjust publicRoutes and matcher as needed.
 */
const isPublicRoute = createRouteMatcher([
  // public read-only pages
  "/team/:path*",
  "/tournament/:path*",
  "/player/:path*",
  "/_next/:path*",
  "/api/public/:path*",
  "/favicon.ico",
  "/sign-in",
  "/sign-up",
]);

export default clerkMiddleware(async (auth, req) => {
  // If you want to redirect unauthenticated users from "/" to sign-in:
  const user = await auth();
  if (!isPublicRoute(req) && !user.userId) {
    const signInUrl = new URL("/sign-in", req.url);
    return NextResponse.redirect(signInUrl);
  }
  if (!user.userId && req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
});

/**
 * Run middleware for all app routes except static assets.
 * Adjust matcher to your needs.
 */
export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"],
};
