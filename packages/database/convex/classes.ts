import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireAuth, getOrgId } from "./lib/auth";

export const list = query({
  args: {
    subject: v.optional(v.string()),
    topic: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    let classes = await ctx.db
      .query("classes")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .order("desc")
      .collect();

    if (args.subject && args.topic) {
      classes = classes.filter(
        (c) => c.subject === args.subject && c.topic === args.topic
      );
    } else if (args.subject) {
      classes = classes.filter((c) => c.subject === args.subject);
    } else if (args.topic) {
      classes = classes.filter((c) => c.topic === args.topic);
    }

    return classes;
  },
});

export const listForBatch = query({
  args: {
    batchId: v.optional(v.id("batches")),
    subject: v.optional(v.string()),
    topic: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    if (!user.organizationId) return [];

    let classes = await ctx.db
      .query("classes")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId!))
      .order("desc")
      .collect();

    if (args.subject && args.topic) {
      classes = classes.filter(
        (c) => c.subject === args.subject && c.topic === args.topic
      );
    } else if (args.subject) {
      classes = classes.filter((c) => c.subject === args.subject);
    } else if (args.topic) {
      classes = classes.filter((c) => c.topic === args.topic);
    }

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
    await requireAuth(ctx);
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
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    return await ctx.db.insert("classes", {
      ...args,
      organizationId: orgId,
      createdBy: admin._id,
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
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const cls = await ctx.db.get(args.id);
    if (cls && cls.organizationId !== orgId) throw new Error("Access denied");
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
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const cls = await ctx.db.get(args.id);
    if (cls && cls.organizationId !== orgId) throw new Error("Access denied");
    await ctx.db.delete(args.id);
  },
});
