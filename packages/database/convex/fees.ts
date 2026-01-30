import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const getByStudent = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
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
    const fees = await ctx.db.query("fees").collect();

    const results = await Promise.all(
      fees.map(async (fee) => {
        const student = await ctx.db.get(fee.studentId);
        const batch = student?.batchId
          ? await ctx.db.get(student.batchId)
          : null;
        return {
          ...fee,
          studentName: student?.name ?? "Unknown",
          studentEmail: student?.email ?? "",
          batchName: batch?.name ?? "No Batch",
          batchId: student?.batchId ?? null,
        };
      })
    );

    return results.sort((a, b) => b.dueDate - a.dueDate);
  },
});

export const getDueNotifications = query({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - THIRTY_DAYS_MS;
    const dueFees = await ctx.db
      .query("fees")
      .withIndex("by_status", (q) => q.eq("status", "due"))
      .collect();

    const overdue = dueFees.filter((fee) => fee.dueDate <= cutoff);

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
    const cutoff = Date.now() - THIRTY_DAYS_MS;
    const dueFees = await ctx.db
      .query("fees")
      .withIndex("by_status", (q) => q.eq("status", "due"))
      .collect();

    return dueFees.filter((fee) => fee.dueDate <= cutoff).length;
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
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.createdBy);
    if (!creator || (creator.role !== "admin" && creator.role !== "teacher")) {
      throw new Error("Only admins and teachers can manage fees.");
    }

    return await ctx.db.insert("fees", {
      studentId: args.studentId,
      amount: args.amount,
      status: args.status,
      dueDate: args.dueDate,
      paidDate: args.paidDate,
      description: args.description,
      createdBy: args.createdBy,
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
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const updater = await ctx.db.get(args.updatedBy);
    if (!updater || (updater.role !== "admin" && updater.role !== "teacher")) {
      throw new Error("Only admins and teachers can manage fees.");
    }

    const { id, updatedBy, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

export const markAsPaid = mutation({
  args: {
    id: v.id("fees"),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const updater = await ctx.db.get(args.updatedBy);
    if (!updater || (updater.role !== "admin" && updater.role !== "teacher")) {
      throw new Error("Only admins and teachers can manage fees.");
    }

    await ctx.db.patch(args.id, {
      status: "paid",
      paidDate: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("fees"),
    deletedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const deleter = await ctx.db.get(args.deletedBy);
    if (!deleter || (deleter.role !== "admin" && deleter.role !== "teacher")) {
      throw new Error("Only admins and teachers can manage fees.");
    }

    await ctx.db.delete(args.id);
  },
});
