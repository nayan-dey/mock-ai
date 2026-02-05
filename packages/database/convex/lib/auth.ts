import { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;
type Ctx = QueryCtx | MutationCtx;

/**
 * Get the authenticated user from the Convex auth context.
 * Returns null if not authenticated or user not found in DB.
 */
export async function getAuthUser(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  // Clerk tokenIdentifier format: "<issuer>|<subject>"
  // The subject is the Clerk userId
  const clerkId = identity.subject;

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
    .first();

  return user;
}

/**
 * Require a valid Clerk identity (JWT). Does NOT require a DB user record.
 * Use this for upsert/create flows where the user may not exist in DB yet.
 * Returns the Clerk subject (userId) from the token.
 */
export async function requireIdentity(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required");
  }
  return identity.subject; // This is the Clerk userId
}

/**
 * Require a valid Clerk identity AND verify it matches the given clerkId.
 * Prevents users from impersonating others by passing a different clerkId.
 */
export async function requireMatchingIdentity(ctx: Ctx, clerkId: string) {
  const callerClerkId = await requireIdentity(ctx);
  if (callerClerkId !== clerkId) {
    throw new Error("Identity mismatch: you can only perform this action for your own account");
  }
  return callerClerkId;
}

/**
 * Require authentication. Throws if not authenticated.
 */
export async function requireAuth(ctx: Ctx) {
  const user = await getAuthUser(ctx);
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

/**
 * Require admin role. Throws if not admin.
 */
export async function requireAdmin(ctx: Ctx) {
  const user = await requireAuth(ctx);
  if (user.role !== "admin") {
    throw new Error("Admin access required");
  }
  return user;
}

/**
 * Get the organizationId from a user. Throws if not set.
 */
export function getOrgId(user: { organizationId?: string }) {
  if (!user.organizationId) {
    throw new Error("Organization not configured. Please complete onboarding.");
  }
  return user.organizationId as Id<"organizations">;
}

/**
 * Require admin and return their organizationId.
 */
export async function requireAdminWithOrg(ctx: Ctx) {
  const admin = await requireAdmin(ctx);
  const orgId = getOrgId(admin);
  return { admin, orgId };
}

/**
 * Require that user is not suspended. Throws if suspended.
 */
export async function requireNotSuspended(ctx: Ctx) {
  const user = await requireAuth(ctx);
  if (user.isSuspended) {
    throw new Error("Account is suspended");
  }
  return user;
}
