import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyTokenForEdge } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  // Try to get token from Authorization header first, then cookie
  const authHeader = request.headers.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ") 
    ? authHeader.substring(7) 
    : null;
  const tokenFromCookie = request.cookies.get("auth-token")?.value;
  const token = tokenFromHeader || tokenFromCookie;
  
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (pathname.startsWith("/_next") || 
      pathname.startsWith("/api/icon") || 
      pathname.startsWith("/api/cron") ||
      pathname.startsWith("/api/auth") || // Allow all auth API routes
      pathname === "/sw.js" ||
      pathname === "/manifest.json") {
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If accessing public route
  if (isPublicRoute) {
    // If user is logged in and tries to access login/register, redirect to home
    if (token) {
      const user = await verifyTokenForEdge(token);
      if (user) {
        console.log("Middleware: User authenticated, redirecting from", pathname, "to /");
        return NextResponse.redirect(new URL("/", request.url));
      } else {
        console.log("Middleware: Invalid token on public route", pathname);
      }
    }
    return NextResponse.next();
  }

  // Protected routes require authentication
  if (!token) {
    console.log("Middleware: No token found, redirecting to login from", pathname);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = await verifyTokenForEdge(token);
  if (!user) {
    console.log("Middleware: Token verification failed, redirecting to login from", pathname);
    // Invalid token, clear cookie and redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth-token");
    return response;
  }

  console.log("Middleware: User authenticated, allowing access to", pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (service worker)
     * - manifest.json (PWA manifest)
     * - api/icon (icon API)
     * - api/cron (cron API - should be public for Vercel)
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|api/icon|api/cron).*)",
  ],
};
