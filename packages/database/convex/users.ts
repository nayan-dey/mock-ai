import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireAuth, getAuthUser, getOrgId } from "./lib/auth";

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await requireAuth(ctx);
    const user = await ctx.db.get(args.id);
    if (!user) return null;

    // Admins get full data; users can only see their own full data
    if (caller.role === "admin" || caller._id === args.id) {
      return user;
    }

    // Other users get limited data
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      name: user.name,
      role: user.role,
      batchId: user.batchId,
      createdAt: user.createdAt,
    };
  },
});

export const list = query({
  args: {
    role: v.optional(
      v.union(v.literal("student"), v.literal("teacher"), v.literal("admin"))
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    let users = await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();

    if (args.role) {
      users = users.filter((u) => u.role === args.role);
    }
    return users;
  },
});

export const create = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("student"), v.literal("teacher"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      role: args.role,
      createdAt: Date.now(),
    });
  },
});

export const updateRole = mutation({
  args: {
    id: v.id("users"),
    role: v.union(v.literal("student"), v.literal("teacher"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { role: args.role });
  },
});

export const upsertFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      // Block admins from accessing the student portal
      if (existing.role === "admin") {
        throw new Error(
          "This account is registered as an admin. You cannot access the student portal."
        );
      }
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      role: "student",
      createdAt: Date.now(),
    });
  },
});

export const upsertAsAdmin = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      // Block students from accessing the admin portal
      if (existing.role === "student") {
        throw new Error(
          "This account is registered as a student. You cannot access the admin portal."
        );
      }
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      role: "admin",
      createdAt: Date.now(),
    });
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    age: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Derive userId from auth — users can only update their own profile
    const user = await requireAuth(ctx);

    // Validation
    if (args.name !== undefined && (args.name.length < 1 || args.name.length > 100)) {
      throw new Error("Name must be 1-100 characters");
    }
    if (args.bio !== undefined && args.bio.length > 500) {
      throw new Error("Bio must be at most 500 characters");
    }
    if (args.age !== undefined && (args.age < 1 || args.age > 120)) {
      throw new Error("Age must be between 1 and 120");
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(args).filter(([_, value]) => value !== undefined)
    );
    await ctx.db.patch(user._id, filteredUpdates);
  },
});

export const suspendUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.organizationId !== orgId) {
      throw new Error("Access denied");
    }

    if (user.role === "admin") {
      throw new Error("Cannot suspend admin users");
    }

    await ctx.db.patch(args.userId, {
      isSuspended: true,
      suspendedAt: Date.now(),
      suspendedBy: admin._id,
      suspendReason: args.reason,
    });

    return { success: true };
  },
});

export const unsuspendUser = mutation({
  args: {
    userId: v.id("users"),
    batchId: v.id("batches"),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const user = await ctx.db.get(args.userId);
    if (!user || user.organizationId !== orgId) {
      throw new Error("Access denied");
    }

    const batch = await ctx.db.get(args.batchId);
    if (!batch || !batch.isActive || batch.organizationId !== orgId) {
      throw new Error("Invalid or inactive batch");
    }

    await ctx.db.patch(args.userId, {
      isSuspended: false,
      suspendedAt: undefined,
      suspendedBy: undefined,
      suspendReason: undefined,
      batchId: args.batchId,
    });

    return { success: true };
  },
});

export const listSuspendedUsers = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const allSuspended = await ctx.db
      .query("users")
      .withIndex("by_suspended", (q) => q.eq("isSuspended", true))
      .collect();

    const users = allSuspended.filter((u) => u.organizationId === orgId);

    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const batch = user.batchId ? await ctx.db.get(user.batchId) : null;
        const suspendedByUser = user.suspendedBy
          ? await ctx.db.get(user.suspendedBy)
          : null;

        return {
          ...user,
          batchName: batch?.name || "No Batch",
          suspendedByName: suspendedByUser?.name || "Unknown",
        };
      })
    );

    return enrichedUsers;
  },
});

export const getPublicProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    const batch = user.batchId ? await ctx.db.get(user.batchId) : null;

    return {
      _id: user._id,
      name: user.name,
      bio: user.bio,
      age: user.age,
      createdAt: user.createdAt,
      batchId: user.batchId,
      batchName: batch?.name || null,
      isSuspended: user.isSuspended || false,
      // Strip suspendReason — not for public consumption
      showHeatmap: settings?.showHeatmap ?? true,
      showStats: settings?.showStats ?? true,
      showOnLeaderboard: settings?.showOnLeaderboard ?? true,
    };
  },
});
