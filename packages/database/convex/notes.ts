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

    let notes = await ctx.db
      .query("notes")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .order("desc")
      .collect();

    if (args.subject && args.topic) {
      notes = notes.filter(
        (n) => n.subject === args.subject && n.topic === args.topic
      );
    } else if (args.subject) {
      notes = notes.filter((n) => n.subject === args.subject);
    } else if (args.topic) {
      notes = notes.filter((n) => n.topic === args.topic);
    }

    return notes;
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

    let notes = await ctx.db
      .query("notes")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId!))
      .order("desc")
      .collect();

    if (args.subject && args.topic) {
      notes = notes.filter(
        (n) => n.subject === args.subject && n.topic === args.topic
      );
    } else if (args.subject) {
      notes = notes.filter((n) => n.subject === args.subject);
    } else if (args.topic) {
      notes = notes.filter((n) => n.topic === args.topic);
    }

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
    await requireAuth(ctx);
    return await ctx.db.get(args.id);
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    subject: v.string(),
    topic: v.string(),
    fileUrl: v.string(),
    storageId: v.optional(v.id("_storage")),
    batchIds: v.optional(v.array(v.id("batches"))),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    return await ctx.db.insert("notes", {
      ...args,
      organizationId: orgId,
      createdBy: admin._id,
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
    storageId: v.optional(v.id("_storage")),
    batchIds: v.optional(v.array(v.id("batches"))),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const note = await ctx.db.get(args.id);
    if (note && note.organizationId !== orgId) throw new Error("Access denied");
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
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const note = await ctx.db.get(args.id);
    if (note && note.organizationId !== orgId) throw new Error("Access denied");
    await ctx.db.delete(args.id);
  },
});
