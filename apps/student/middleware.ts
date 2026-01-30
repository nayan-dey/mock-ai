import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/clerk(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl;
  const ref = url.searchParams.get("ref");

  // Redirect authenticated users from home page to dashboard
  if (userId && url.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Authenticated user at sign-up with ref → onboarding with ref
  if (userId && url.pathname.startsWith("/sign-up") && ref) {
    return NextResponse.redirect(
      new URL(`/onboarding?ref=${ref}`, req.url)
    );
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
