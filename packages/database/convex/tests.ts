import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    status: v.optional(
      v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))
    ),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("tests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("tests").order("desc").collect();
  },
});

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tests")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc")
      .collect();
  },
});

export const listPublishedForBatch = query({
  args: { batchId: v.optional(v.id("batches")) },
  handler: async (ctx, args) => {
    const tests = await ctx.db
      .query("tests")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc")
      .collect();

    // Filter by batch - show tests where batchIds is empty/undefined OR includes user's batch
    if (args.batchId) {
      return tests.filter(
        (test) =>
          !test.batchIds ||
          test.batchIds.length === 0 ||
          test.batchIds.includes(args.batchId!)
      );
    }
    // If no batchId provided, show only tests with no batch restriction
    return tests.filter((test) => !test.batchIds || test.batchIds.length === 0);
  },
});

export const getById = query({
  args: { id: v.id("tests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWithQuestions = query({
  args: { id: v.id("tests") },
  handler: async (ctx, args) => {
    const test = await ctx.db.get(args.id);
    if (!test) return null;

    const questions = await Promise.all(
      test.questions.map((qId) => ctx.db.get(qId))
    );

    return {
      ...test,
      questionDetails: questions.filter(Boolean),
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    questions: v.array(v.id("questions")),
    duration: v.number(),
    totalMarks: v.number(),
    negativeMarking: v.number(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    scheduledAt: v.optional(v.number()),
    batchIds: v.optional(v.array(v.id("batches"))),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tests", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tests"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    questions: v.optional(v.array(v.id("questions"))),
    duration: v.optional(v.number()),
    totalMarks: v.optional(v.number()),
    negativeMarking: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))
    ),
    scheduledAt: v.optional(v.number()),
    batchIds: v.optional(v.array(v.id("batches"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

export const publish = mutation({
  args: { id: v.id("tests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "published" });
  },
});

export const archive = mutation({
  args: { id: v.id("tests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "archived" });
  },
});

export const remove = mutation({
  args: { id: v.id("tests") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
