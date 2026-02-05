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
    const user = await requireAuth(ctx);
    const batch = await ctx.db.get(args.id);
    if (!batch) return null;
    if (!user.organizationId || batch.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }
    return batch;
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
    monthlyFee: v.optional(v.number()),
    enrollmentFee: v.optional(v.number()),
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
      monthlyFee: args.monthlyFee,
      enrollmentFee: args.enrollmentFee,
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
    monthlyFee: v.optional(v.number()),
    enrollmentFee: v.optional(v.number()),
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
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const batch = await ctx.db.get(args.batchId);
    if (!batch || batch.organizationId !== orgId) {
      throw new Error("Access denied");
    }
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
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const batch = await ctx.db.get(args.batchId);
    const user = await ctx.db.get(args.userId);

    if (!batch || !user) {
      throw new Error("User or batch not found");
    }
    if (batch.organizationId !== orgId) throw new Error("Access denied");
    if (user.organizationId && user.organizationId !== orgId) throw new Error("Access denied");

    const enrolledAt = Date.now();

    // Set batchId and enrolledAt
    await ctx.db.patch(args.userId, {
      batchId: args.batchId,
      enrolledAt: enrolledAt,
    });

    // Create enrollment fee if configured
    if (batch.enrollmentFee && batch.enrollmentFee > 0) {
      await ctx.db.insert("fees", {
        studentId: args.userId,
        amount: batch.enrollmentFee,
        status: "due",
        dueDate: enrolledAt + 7 * 24 * 60 * 60 * 1000, // Due in 7 days
        description: `Enrollment Fee - ${batch.name}`,
        isAutoGenerated: true,
        organizationId: batch.organizationId,
        createdBy: admin._id,
        createdAt: enrolledAt,
      });
    }

    // Create first monthly fee if configured
    if (batch.monthlyFee && batch.monthlyFee > 0) {
      const monthName = new Date(enrolledAt).toLocaleString("en-US", { month: "long", year: "numeric" });
      await ctx.db.insert("fees", {
        studentId: args.userId,
        amount: batch.monthlyFee,
        status: "due",
        dueDate: enrolledAt + 30 * 24 * 60 * 60 * 1000, // Due in 30 days
        description: `Monthly Fee - ${monthName}`,
        isAutoGenerated: true,
        organizationId: batch.organizationId,
        createdBy: admin._id,
        createdAt: enrolledAt,
      });
    }
  },
});

export const removeUserFromBatch = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const user = await ctx.db.get(args.userId);
    if (!user || user.organizationId !== orgId) throw new Error("Access denied");
    await ctx.db.patch(args.userId, { batchId: undefined });
  },
});

export const joinByReferralCode = mutation({
  args: {
    referralCode: v.string(),
    organizationId: v.id("organizations"),
    phone: v.string(),
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

    const enrolledAt = Date.now();

    // Set batchId, organizationId, enrolledAt, and phone on the student
    await ctx.db.patch(user._id, {
      batchId: batch._id,
      organizationId: args.organizationId,
      enrolledAt: enrolledAt,
      phone: args.phone,
    });

    // Create enrollment fee if configured
    if (batch.enrollmentFee && batch.enrollmentFee > 0) {
      await ctx.db.insert("fees", {
        studentId: user._id,
        amount: batch.enrollmentFee,
        status: "due",
        dueDate: enrolledAt + 7 * 24 * 60 * 60 * 1000, // Due in 7 days
        description: `Enrollment Fee - ${batch.name}`,
        isAutoGenerated: true,
        organizationId: args.organizationId,
        createdBy: user._id,
        createdAt: enrolledAt,
      });
    }

    // Create first monthly fee if configured
    if (batch.monthlyFee && batch.monthlyFee > 0) {
      const monthName = new Date(enrolledAt).toLocaleString("en-US", { month: "long", year: "numeric" });
      await ctx.db.insert("fees", {
        studentId: user._id,
        amount: batch.monthlyFee,
        status: "due",
        dueDate: enrolledAt + 30 * 24 * 60 * 60 * 1000, // Due in 30 days
        description: `Monthly Fee - ${monthName}`,
        isAutoGenerated: true,
        organizationId: args.organizationId,
        createdBy: user._id,
        createdAt: enrolledAt,
      });
    }

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
