import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db
        .query("batches")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    }
    return await ctx.db.query("batches").collect();
  },
});

export const getById = query({
  args: { id: v.id("batches") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("batches", {
      name: args.name,
      description: args.description,
      isActive: true,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("batches"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

export const remove = mutation({
  args: { id: v.id("batches") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getStudentsByBatch = query({
  args: { batchId: v.id("batches") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .collect();
  },
});

export const assignUserToBatch = mutation({
  args: {
    userId: v.id("users"),
    batchId: v.id("batches"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { batchId: args.batchId });
  },
});

export const removeUserFromBatch = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { batchId: undefined });
  },
});
