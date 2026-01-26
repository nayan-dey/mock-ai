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
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    await ctx.db.patch(userId, filteredUpdates);
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

    return {
      _id: user._id,
      name: user.name,
      bio: user.bio,
      createdAt: user.createdAt,
      // Privacy-controlled fields
      showHeatmap: settings?.showHeatmap ?? true,
      showStats: settings?.showStats ?? true,
      showOnLeaderboard: settings?.showOnLeaderboard ?? true,
    };
  },
});
