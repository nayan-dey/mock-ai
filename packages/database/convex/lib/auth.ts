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
