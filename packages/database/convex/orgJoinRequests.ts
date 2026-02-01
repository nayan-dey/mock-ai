import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireAuth, getOrgId } from "./lib/auth";

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    if (user.role !== "admin") {
      throw new Error("Only admins can request to join an organization");
    }

    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity!.subject;

    // Check if already an admin of this org
    const existingAdmin = await ctx.db
      .query("orgAdmins")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existingAdmin) {
      throw new Error("You are already an admin of an organization");
    }

    // Check for existing pending request
    const existingRequest = await ctx.db
      .query("orgJoinRequests")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingRequest) {
      throw new Error("You already have a pending join request");
    }

    // Verify org exists
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found");
    }

    return await ctx.db.insert("orgJoinRequests", {
      organizationId: args.organizationId,
      clerkId,
      userName: user.name,
      userEmail: user.email,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const getMyPendingRequest = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const clerkId = identity.subject;

    const request = await ctx.db
      .query("orgJoinRequests")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (!request) return null;

    // Enrich with org name
    const org = await ctx.db.get(request.organizationId);
    return {
      ...request,
      organizationName: org?.name ?? "Unknown",
    };
  },
});

export const listPendingForOrg = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    return await ctx.db
      .query("orgJoinRequests")
      .withIndex("by_org_status", (q) =>
        q.eq("organizationId", orgId).eq("status", "pending")
      )
      .collect();
  },
});

export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const pending = await ctx.db
      .query("orgJoinRequests")
      .withIndex("by_org_status", (q) =>
        q.eq("organizationId", orgId).eq("status", "pending")
      )
      .collect();

    return pending.length;
  },
});

export const approve = mutation({
  args: {
    requestId: v.id("orgJoinRequests"),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.organizationId !== orgId) {
      throw new Error("You can only approve requests for your organization");
    }
    if (request.status !== "pending") {
      throw new Error("Request is no longer pending");
    }

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: "approved",
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
    });

    // Add to orgAdmins (joined admins are normal admins, not super)
    await ctx.db.insert("orgAdmins", {
      clerkId: request.clerkId,
      organizationId: orgId,
      isSuperAdmin: false,
      createdAt: Date.now(),
    });

    // Update the requesting user's organizationId
    const requestingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", request.clerkId))
      .first();

    if (requestingUser) {
      await ctx.db.patch(requestingUser._id, { organizationId: orgId });
    }
  },
});

export const reject = mutation({
  args: {
    requestId: v.id("orgJoinRequests"),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.organizationId !== orgId) {
      throw new Error("You can only reject requests for your organization");
    }
    if (request.status !== "pending") {
      throw new Error("Request is no longer pending");
    }

    await ctx.db.patch(args.requestId, {
      status: "rejected",
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
    });
  },
});
