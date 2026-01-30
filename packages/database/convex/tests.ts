import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireAuth, getOrgId } from "./lib/auth";

export const list = query({
  args: {
    status: v.optional(
      v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const allTests = await ctx.db
      .query("tests")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .order("desc")
      .collect();

    if (args.status) {
      return allTests.filter((t) => t.status === args.status);
    }
    return allTests;
  },
});

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    // Scope by user's org
    if (!user.organizationId) return [];

    const tests = await ctx.db
      .query("tests")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId!))
      .order("desc")
      .collect();

    return tests.filter((t) => t.status === "published");
  },
});

export const listPublishedForBatch = query({
  args: { batchId: v.optional(v.id("batches")) },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    if (!user.organizationId) return [];

    const tests = await ctx.db
      .query("tests")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId!))
      .order("desc")
      .collect();

    const published = tests.filter((t) => t.status === "published");

    if (args.batchId) {
      return published.filter(
        (test) =>
          !test.batchIds ||
          test.batchIds.length === 0 ||
          test.batchIds.includes(args.batchId!)
      );
    }
    return published.filter((test) => !test.batchIds || test.batchIds.length === 0);
  },
});

export const getById = query({
  args: { id: v.id("tests") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getWithQuestions = query({
  args: { id: v.id("tests") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const test = await ctx.db.get(args.id);
    if (!test) return null;

    const questions = await Promise.all(
      test.questions.map((qId) => ctx.db.get(qId))
    );

    const filteredQuestions = questions.filter(Boolean);

    if (user.role !== "admin") {
      const isReviewMode = test.answerKeyPublished === true;
      return {
        ...test,
        questionDetails: filteredQuestions.map((q) => ({
          ...q,
          correctOptions: isReviewMode ? q!.correctOptions : [],
          explanation: isReviewMode ? q!.explanation : undefined,
        })),
      };
    }

    return {
      ...test,
      questionDetails: filteredQuestions,
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
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    return await ctx.db.insert("tests", {
      ...args,
      organizationId: orgId,
      createdBy: admin._id,
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
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const test = await ctx.db.get(args.id);
    if (test && test.organizationId !== orgId) throw new Error("Access denied");
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
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const test = await ctx.db.get(args.id);
    if (test && test.organizationId !== orgId) throw new Error("Access denied");
    await ctx.db.patch(args.id, { status: "published" });
  },
});

export const archive = mutation({
  args: { id: v.id("tests") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const test = await ctx.db.get(args.id);
    if (test && test.organizationId !== orgId) throw new Error("Access denied");
    await ctx.db.patch(args.id, { status: "archived" });
  },
});

export const unarchive = mutation({
  args: { id: v.id("tests") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const test = await ctx.db.get(args.id);
    if (!test) throw new Error("Test not found");
    if (test.organizationId !== orgId) throw new Error("Access denied");
    if (test.status !== "archived") throw new Error("Test is not archived");
    await ctx.db.patch(args.id, { status: "published" });
  },
});

export const toggleAnswerKey = mutation({
  args: { id: v.id("tests") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const test = await ctx.db.get(args.id);
    if (!test) throw new Error("Test not found");
    if (test.organizationId !== orgId) throw new Error("Access denied");
    await ctx.db.patch(args.id, {
      answerKeyPublished: !test.answerKeyPublished,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("tests") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const test = await ctx.db.get(args.id);
    if (test && test.organizationId !== orgId) throw new Error("Access denied");
    await ctx.db.delete(args.id);
  },
});
