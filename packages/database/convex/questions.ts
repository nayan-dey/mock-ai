import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    subject: v.optional(v.string()),
    topic: v.optional(v.string()),
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))
    ),
  },
  handler: async (ctx, args) => {
    let questions;

    if (args.subject && args.topic) {
      questions = await ctx.db
        .query("questions")
        .withIndex("by_subject_topic", (q) =>
          q.eq("subject", args.subject!).eq("topic", args.topic!)
        )
        .collect();
    } else if (args.subject) {
      questions = await ctx.db
        .query("questions")
        .withIndex("by_subject", (q) => q.eq("subject", args.subject!))
        .collect();
    } else if (args.topic) {
      questions = await ctx.db
        .query("questions")
        .withIndex("by_topic", (q) => q.eq("topic", args.topic!))
        .collect();
    } else {
      questions = await ctx.db.query("questions").collect();
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
    return await ctx.db.get(args.id);
  },
});

export const getByIds = query({
  args: { ids: v.array(v.id("questions")) },
  handler: async (ctx, args) => {
    const questions = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return questions.filter(Boolean);
  },
});

export const create = mutation({
  args: {
    text: v.string(),
    options: v.array(v.string()),
    correctOptions: v.array(v.number()),
    explanation: v.optional(v.string()),
    subject: v.string(),
    topic: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("questions", {
      ...args,
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
    topic: v.optional(v.string()),
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

export const remove = mutation({
  args: { id: v.id("questions") },
  handler: async (ctx, args) => {
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
        topic: v.string(),
        difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
      })
    ),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const ids = await Promise.all(
      args.questions.map((question) =>
        ctx.db.insert("questions", {
          ...question,
          createdBy: args.createdBy,
          createdAt: Date.now(),
        })
      )
    );
    return ids;
  },
});
