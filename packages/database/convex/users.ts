import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {
    role: v.optional(
      v.union(v.literal("student"), v.literal("teacher"), v.literal("admin"))
    ),
  },
  handler: async (ctx, args) => {
    if (args.role) {
      return await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.role!))
        .collect();
    }
    return await ctx.db.query("users").collect();
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
      // Update name/email and ensure role is admin
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        role: "admin",
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

export const updateBatch = mutation({
  args: {
    userId: v.id("users"),
    batchId: v.optional(v.id("batches")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { batchId: args.batchId });
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    age: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    await ctx.db.patch(userId, filteredUpdates);
  },
});

export const suspendUser = mutation({
  args: {
    userId: v.id("users"),
    adminId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Only admins can suspend users");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.role === "admin") {
      throw new Error("Cannot suspend admin users");
    }

    await ctx.db.patch(args.userId, {
      isSuspended: true,
      suspendedAt: Date.now(),
      suspendedBy: args.adminId,
      suspendReason: args.reason,
    });

    return { success: true };
  },
});

export const unsuspendUser = mutation({
  args: {
    userId: v.id("users"),
    adminId: v.id("users"),
    batchId: v.id("batches"), // Required - admin must assign a batch
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Only admins can unsuspend users");
    }

    // Verify batch exists and is active
    const batch = await ctx.db.get(args.batchId);
    if (!batch || !batch.isActive) {
      throw new Error("Invalid or inactive batch");
    }

    await ctx.db.patch(args.userId, {
      isSuspended: false,
      suspendedAt: undefined,
      suspendedBy: undefined,
      suspendReason: undefined,
      batchId: args.batchId,
      batchLocked: true, // Lock batch switching for this user
    });

    return { success: true };
  },
});

export const listSuspendedUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_suspended", (q) => q.eq("isSuspended", true))
      .collect();

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
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Get user settings for privacy
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    // Get batch info
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
      suspendReason: user.suspendReason,
      // Privacy-controlled fields
      showHeatmap: settings?.showHeatmap ?? true,
      showStats: settings?.showStats ?? true,
      showOnLeaderboard: settings?.showOnLeaderboard ?? true,
    };
  },
});
