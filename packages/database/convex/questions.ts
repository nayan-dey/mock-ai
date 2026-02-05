import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireAuth, getOrgId } from "./lib/auth";

export const list = query({
  args: {
    subject: v.optional(v.string()),
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    let questions = await ctx.db
      .query("questions")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();

    if (args.subject) {
      questions = questions.filter((q) => q.subject === args.subject);
    }

    if (args.difficulty) {
      questions = questions.filter((q) => q.difficulty === args.difficulty);
    }

    return questions;
  },
});

export const getById = query({
  args: { id: v.id("questions") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const question = await ctx.db.get(args.id);
    if (!question) return null;
    if (question.organizationId !== orgId) throw new Error("Access denied");
    return question;
  },
});

export const getByIds = query({
  args: { ids: v.array(v.id("questions")) },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const questions = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    const valid = questions.filter(
      (q): q is NonNullable<typeof q> => q != null && q.organizationId === orgId
    );
    return valid;
  },
});

export const create = mutation({
  args: {
    text: v.string(),
    options: v.array(v.string()),
    correctOptions: v.array(v.number()),
    explanation: v.optional(v.string()),
    subject: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    if (args.correctOptions.length === 0) {
      throw new Error("At least one correct option is required");
    }
    if (args.options.length < 2) {
      throw new Error("At least 2 options are required");
    }
    for (const idx of args.correctOptions) {
      if (idx < 0 || idx >= args.options.length) {
        throw new Error(`correctOptions index ${idx} is out of range (0-${args.options.length - 1})`);
      }
    }
    if (new Set(args.correctOptions).size !== args.correctOptions.length) {
      throw new Error("Duplicate indices in correctOptions");
    }

    return await ctx.db.insert("questions", {
      ...args,
      organizationId: orgId,
      createdBy: admin._id,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("questions"),
    text: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    correctOptions: v.optional(v.array(v.number())),
    explanation: v.optional(v.string()),
    subject: v.optional(v.string()),
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const { id, ...updates } = args;

    const question = await ctx.db.get(id);
    if (!question) throw new Error("Question not found");
    if (question.organizationId !== orgId) throw new Error("Access denied");

    const finalOptions = updates.options ?? question.options;
    const finalCorrectOptions = updates.correctOptions ?? question.correctOptions;

    if (updates.correctOptions || updates.options) {
      if (finalCorrectOptions.length === 0) {
        throw new Error("At least one correct option is required");
      }
      if (finalOptions.length < 2) {
        throw new Error("At least 2 options are required");
      }
      for (const idx of finalCorrectOptions) {
        if (idx < 0 || idx >= finalOptions.length) {
          throw new Error(`correctOptions index ${idx} is out of range (0-${finalOptions.length - 1})`);
        }
      }
      if (new Set(finalCorrectOptions).size !== finalCorrectOptions.length) {
        throw new Error("Duplicate indices in correctOptions");
      }
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

export const remove = mutation({
  args: { id: v.id("questions") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const question = await ctx.db.get(args.id);
    if (question && question.organizationId !== orgId) throw new Error("Access denied");
    await ctx.db.delete(args.id);
  },
});

export const bulkCreate = mutation({
  args: {
    questions: v.array(
      v.object({
        text: v.string(),
        options: v.array(v.string()),
        correctOptions: v.array(v.number()),
        explanation: v.optional(v.string()),
        subject: v.string(),
        difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    for (const q of args.questions) {
      if (q.correctOptions.length === 0) {
        throw new Error("At least one correct option is required");
      }
      if (q.options.length < 2) {
        throw new Error("At least 2 options are required");
      }
      for (const idx of q.correctOptions) {
        if (idx < 0 || idx >= q.options.length) {
          throw new Error(`correctOptions index ${idx} is out of range`);
        }
      }
    }

    const ids = await Promise.all(
      args.questions.map((question) =>
        ctx.db.insert("questions", {
          ...question,
          organizationId: orgId,
          createdBy: admin._id,
          createdAt: Date.now(),
        })
      )
    );
    return ids;
  },
});
