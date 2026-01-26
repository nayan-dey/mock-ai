import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    subject: v.optional(v.string()),
    topic: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.subject && args.topic) {
      return await ctx.db
        .query("classes")
        .withIndex("by_subject_topic", (q) =>
          q.eq("subject", args.subject!).eq("topic", args.topic!)
        )
        .order("desc")
        .collect();
    }
    if (args.subject) {
      return await ctx.db
        .query("classes")
        .withIndex("by_subject", (q) => q.eq("subject", args.subject!))
        .order("desc")
        .collect();
    }
    if (args.topic) {
      return await ctx.db
        .query("classes")
        .withIndex("by_topic", (q) => q.eq("topic", args.topic!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("classes").order("desc").collect();
  },
});

export const listForBatch = query({
  args: {
    batchId: v.optional(v.id("batches")),
    subject: v.optional(v.string()),
    topic: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let classes;
    if (args.subject && args.topic) {
      classes = await ctx.db
        .query("classes")
        .withIndex("by_subject_topic", (q) =>
          q.eq("subject", args.subject!).eq("topic", args.topic!)
        )
        .order("desc")
        .collect();
    } else if (args.subject) {
      classes = await ctx.db
        .query("classes")
        .withIndex("by_subject", (q) => q.eq("subject", args.subject!))
        .order("desc")
        .collect();
    } else if (args.topic) {
      classes = await ctx.db
        .query("classes")
        .withIndex("by_topic", (q) => q.eq("topic", args.topic!))
        .order("desc")
        .collect();
    } else {
      classes = await ctx.db.query("classes").order("desc").collect();
    }

    // Filter by batch
    if (args.batchId) {
      return classes.filter(
        (cls) =>
          !cls.batchIds ||
          cls.batchIds.length === 0 ||
          cls.batchIds.includes(args.batchId!)
      );
    }
    return classes.filter((cls) => !cls.batchIds || cls.batchIds.length === 0);
  },
});

export const getById = query({
  args: { id: v.id("classes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    subject: v.string(),
    topic: v.string(),
    videoUrl: v.string(),
    duration: v.number(),
    thumbnail: v.optional(v.string()),
    batchIds: v.optional(v.array(v.id("batches"))),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("classes", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("classes"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    subject: v.optional(v.string()),
    topic: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    thumbnail: v.optional(v.string()),
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

export const remove = mutation({
  args: { id: v.id("classes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
