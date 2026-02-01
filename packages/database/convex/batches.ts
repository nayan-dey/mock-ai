import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin, requireAuth, getOrgId } from "./lib/auth";

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
    const user = await requireAuth(ctx);

    // Admin sees only their org's batches
    if (user.role === "admin") {
      const orgId = getOrgId(user);
      const batches = await ctx.db
        .query("batches")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect();
      if (args.activeOnly) {
        return batches.filter((b) => b.isActive);
      }
      return batches;
    }

    // Students see batches in their org
    if (user.organizationId) {
      const batches = await ctx.db
        .query("batches")
        .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId!))
        .collect();
      if (args.activeOnly) {
        return batches.filter((b) => b.isActive);
      }
      return batches;
    }

    return [];
  },
});

export const getById = query({
  args: { id: v.id("batches") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getByReferralCode = query({
  args: { referralCode: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
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
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

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

    if (attempts >= 10) {
      throw new Error("Failed to generate unique referral code. Please try again.");
    }

    return await ctx.db.insert("batches", {
      name: args.name,
      description: args.description,
      isActive: true,
      referralCode,
      organizationId: orgId,
      createdBy: admin._id,
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
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const batch = await ctx.db.get(args.id);
    if (batch && batch.organizationId !== orgId) throw new Error("Access denied");
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
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const batch = await ctx.db.get(args.id);
    if (batch && batch.organizationId !== orgId) throw new Error("Access denied");

    // Clear batchId from users in this batch before deleting
    const usersInBatch = await ctx.db
      .query("users")
      .withIndex("by_batch", (q) => q.eq("batchId", args.id))
      .collect();

    for (const user of usersInBatch) {
      await ctx.db.patch(user._id, { batchId: undefined });
    }

    await ctx.db.delete(args.id);
  },
});

export const countForOrg = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const batches = await ctx.db
      .query("batches")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();
    return batches.length;
  },
});

export const getStudentsByBatch = query({
  args: { batchId: v.id("batches") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
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
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, { batchId: args.batchId });
  },
});

export const removeUserFromBatch = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, { batchId: undefined });
  },
});

export const joinByReferralCode = mutation({
  args: {
    referralCode: v.string(),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

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

    // Verify batch belongs to the selected organization
    if (batch.organizationId !== args.organizationId) {
      throw new Error("This batch code does not belong to the selected institution.");
    }

    if (user.batchId) {
      throw new Error("You are already assigned to a batch.");
    }

    // Set both batchId and organizationId on the student
    await ctx.db.patch(user._id, {
      batchId: batch._id,
      organizationId: args.organizationId,
    });

    // Notify admins about the new student enrollment
    await ctx.scheduler.runAfter(
      0,
      internal.notifications.createNotification,
      {
        organizationId: args.organizationId,
        type: "student_enrolled",
        title: "New Student Enrolled",
        message: `${user.name} joined batch "${batch.name}" via referral code`,
        referenceId: user._id,
        referenceType: "user",
        actorId: user._id,
        actorName: user.name,
      }
    );

    return { success: true, batchName: batch.name };
  },
});
