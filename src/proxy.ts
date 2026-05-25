import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/login(.*)",
  "/manifest.webmanifest",
  "/sw.js",
  "/offline.html",
  "/icons/(.*)",
  "/favicon.ico",
  // Allow all app routes through middleware, auth will be checked client-side or in routes
  "/assessment(.*)",
  "/dashboard(.*)",
  "/history(.*)",
  "/login(.*)",
  "/patients(.*)",
  "/report(.*)",
  "/results(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) return;
  auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\.(?:css|js|json|png|jpg|jpeg|gif|svg|ico|webp|txt|map|woff|woff2)).*)",
    "/(api|trpc)(.*)",
  ],
};
