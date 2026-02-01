import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin, requireAuth, getOrgId } from "./lib/auth";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const getByStudent = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await requireAuth(ctx);

    // Admin can see any student's fees; students can only see their own
    if (caller.role !== "admin" && caller._id !== args.studentId) {
      throw new Error("You can only view your own fees");
    }

    const fees = await ctx.db
      .query("fees")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();
    return fees.sort((a, b) => b.dueDate - a.dueDate);
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const fees = await ctx.db
      .query("fees")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();

    // Batch-fetch all unique student IDs to avoid N+1
    const studentIds = [...new Set(fees.map((f) => f.studentId))];
    const students = await Promise.all(studentIds.map((id) => ctx.db.get(id)));
    const studentMap = new Map(
      students.filter(Boolean).map((s) => [s!._id, s!])
    );

    // Batch-fetch all unique batch IDs
    const batchIds = [
      ...new Set(
        students
          .filter(Boolean)
          .map((s) => s!.batchId)
          .filter(Boolean)
      ),
    ];
    const batches = await Promise.all(batchIds.map((id) => ctx.db.get(id!)));
    const batchMap = new Map(
      batches.filter(Boolean).map((b) => [b!._id, b!])
    );

    const results = fees.map((fee) => {
      const student = studentMap.get(fee.studentId);
      const batch = student?.batchId ? batchMap.get(student.batchId) : null;
      return {
        ...fee,
        studentName: student?.name ?? "Unknown",
        studentEmail: student?.email ?? "",
        batchName: batch?.name ?? "No Batch",
        batchId: student?.batchId ?? null,
      };
    });

    return results.sort((a, b) => b.dueDate - a.dueDate);
  },
});

export const getDueNotifications = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const cutoff = Date.now() - THIRTY_DAYS_MS;
    const allDueFees = await ctx.db
      .query("fees")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();

    const overdue = allDueFees.filter(
      (fee) => fee.status === "due" && fee.dueDate <= cutoff
    );

    const results = await Promise.all(
      overdue.map(async (fee) => {
        const student = await ctx.db.get(fee.studentId);
        return {
          ...fee,
          studentName: student?.name ?? "Unknown",
          studentEmail: student?.email ?? "",
        };
      })
    );

    return results.sort((a, b) => a.dueDate - b.dueDate);
  },
});

export const getDueCount = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const cutoff = Date.now() - THIRTY_DAYS_MS;
    const allFees = await ctx.db
      .query("fees")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();

    return allFees.filter((fee) => fee.status === "due" && fee.dueDate <= cutoff).length;
  },
});

export const create = mutation({
  args: {
    studentId: v.id("users"),
    amount: v.number(),
    status: v.union(v.literal("paid"), v.literal("due")),
    dueDate: v.number(),
    paidDate: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    if (args.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    return await ctx.db.insert("fees", {
      studentId: args.studentId,
      amount: args.amount,
      status: args.status,
      dueDate: args.dueDate,
      paidDate: args.paidDate,
      description: args.description,
      organizationId: orgId,
      createdBy: admin._id,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("fees"),
    amount: v.optional(v.number()),
    status: v.optional(v.union(v.literal("paid"), v.literal("due"))),
    dueDate: v.optional(v.number()),
    paidDate: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const fee = await ctx.db.get(args.id);
    if (fee && fee.organizationId !== orgId) throw new Error("Access denied");

    if (args.amount !== undefined && args.amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

export const markAsPaid = mutation({
  args: {
    id: v.id("fees"),
    paidDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const fee = await ctx.db.get(args.id);
    if (fee && fee.organizationId !== orgId) throw new Error("Access denied");

    await ctx.db.patch(args.id, {
      status: "paid",
      paidDate: args.paidDate ?? Date.now(),
    });

    // Notify admins about the payment
    if (fee) {
      const student = await ctx.db.get(fee.studentId);
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.createNotification,
        {
          organizationId: orgId,
          type: "fee_paid",
          title: "Fee Paid",
          message: `${student?.name ?? "A student"} paid fee of ₹${fee.amount}`,
          referenceId: args.id,
          referenceType: "fee",
          actorId: fee.studentId,
          actorName: student?.name,
        }
      );
    }
  },
});

export const remove = mutation({
  args: {
    id: v.id("fees"),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const fee = await ctx.db.get(args.id);
    if (fee && fee.organizationId !== orgId) throw new Error("Access denied");
    await ctx.db.delete(args.id);
  },
});
