export default {
  providers: [
    {
      // Replace with your Clerk issuer URL from:
      // Clerk Dashboard → JWT Templates → Convex
      // Format: https://<your-clerk-domain>.clerk.accounts.dev
      domain: process.env.CLERK_ISSUER_URL || "https://YOUR_CLERK_DOMAIN.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
