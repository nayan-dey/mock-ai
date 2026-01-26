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
        .query("notes")
        .withIndex("by_subject_topic", (q) =>
          q.eq("subject", args.subject!).eq("topic", args.topic!)
        )
        .order("desc")
        .collect();
    }
    if (args.subject) {
      return await ctx.db
        .query("notes")
        .withIndex("by_subject", (q) => q.eq("subject", args.subject!))
        .order("desc")
        .collect();
    }
    if (args.topic) {
      return await ctx.db
        .query("notes")
        .withIndex("by_topic", (q) => q.eq("topic", args.topic!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("notes").order("desc").collect();
  },
});

export const listForBatch = query({
  args: {
    batchId: v.optional(v.id("batches")),
    subject: v.optional(v.string()),
    topic: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let notes;
    if (args.subject && args.topic) {
      notes = await ctx.db
        .query("notes")
        .withIndex("by_subject_topic", (q) =>
          q.eq("subject", args.subject!).eq("topic", args.topic!)
        )
        .order("desc")
        .collect();
    } else if (args.subject) {
      notes = await ctx.db
        .query("notes")
        .withIndex("by_subject", (q) => q.eq("subject", args.subject!))
        .order("desc")
        .collect();
    } else if (args.topic) {
      notes = await ctx.db
        .query("notes")
        .withIndex("by_topic", (q) => q.eq("topic", args.topic!))
        .order("desc")
        .collect();
    } else {
      notes = await ctx.db.query("notes").order("desc").collect();
    }

    // Filter by batch
    if (args.batchId) {
      return notes.filter(
        (note) =>
          !note.batchIds ||
          note.batchIds.length === 0 ||
          note.batchIds.includes(args.batchId!)
      );
    }
    return notes.filter((note) => !note.batchIds || note.batchIds.length === 0);
  },
});

export const getById = query({
  args: { id: v.id("notes") },
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
    fileUrl: v.string(),
    batchIds: v.optional(v.array(v.id("batches"))),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notes", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("notes"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    subject: v.optional(v.string()),
    topic: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
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
  args: { id: v.id("notes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
