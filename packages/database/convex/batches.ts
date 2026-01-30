import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

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

export const getByReferralCode = query({
  args: { referralCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("batches")
      .withIndex("by_referral_code", (q) =>
        q.eq("referralCode", args.referralCode.toUpperCase())
      )
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Generate unique referral code
    let referralCode = generateReferralCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("batches")
        .withIndex("by_referral_code", (q) =>
          q.eq("referralCode", referralCode)
        )
        .first();
      if (!existing) break;
      referralCode = generateReferralCode();
      attempts++;
    }

    return await ctx.db.insert("batches", {
      name: args.name,
      description: args.description,
      isActive: true,
      referralCode,
      organizationId: args.organizationId,
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

export const joinByReferralCode = mutation({
  args: {
    userId: v.id("users"),
    referralCode: v.string(),
  },
  handler: async (ctx, args) => {
    const batch = await ctx.db
      .query("batches")
      .withIndex("by_referral_code", (q) =>
        q.eq("referralCode", args.referralCode.toUpperCase())
      )
      .first();

    if (!batch) {
      throw new Error("Invalid batch code. Please check with your instructor.");
    }

    if (!batch.isActive) {
      throw new Error("This batch is no longer active.");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found.");
    }

    if (user.batchId) {
      throw new Error("You are already assigned to a batch.");
    }

    await ctx.db.patch(args.userId, { batchId: batch._id });

    return { success: true, batchName: batch.name };
  },
});
