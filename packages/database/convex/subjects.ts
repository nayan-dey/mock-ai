import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAuth, getOrgId } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const orgId = getOrgId(user);

    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_org", (q) => q.eq("organizationId", orgId))
      .collect();

    return subjects.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const trimmed = name.trim();
    if (!trimmed) throw new Error("Subject name is required");

    // Check for duplicates (case-insensitive)
    const existing = await ctx.db
      .query("subjects")
      .withIndex("by_org", (q) => q.eq("organizationId", orgId))
      .collect();

    if (existing.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error("Subject already exists");
    }

    const id = await ctx.db.insert("subjects", {
      name: trimmed,
      organizationId: orgId,
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("subjects"),
    name: v.string(),
  },
  handler: async (ctx, { id, name }) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const subject = await ctx.db.get(id);
    if (!subject) throw new Error("Subject not found");
    if (subject.organizationId !== orgId) throw new Error("Access denied");

    const trimmed = name.trim();
    if (!trimmed) throw new Error("Subject name is required");

    // Check for duplicates (case-insensitive), excluding self
    const existing = await ctx.db
      .query("subjects")
      .withIndex("by_org", (q) => q.eq("organizationId", orgId))
      .collect();

    if (existing.some((s) => s._id !== id && s.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error("Subject already exists");
    }

    await ctx.db.patch(id, { name: trimmed });
  },
});

export const countAssociations = query({
  args: {
    id: v.id("subjects"),
  },
  handler: async (ctx, { id }) => {
    const user = await requireAuth(ctx);
    const orgId = getOrgId(user);

    const subject = await ctx.db.get(id);
    if (!subject || subject.organizationId !== orgId) {
      return { questions: 0, notes: 0, classes: 0 };
    }

    const subjectName = subject.name;

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .filter((q) => q.eq(q.field("subject"), subjectName))
      .collect();

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .filter((q) => q.eq(q.field("subject"), subjectName))
      .collect();

    const classes = await ctx.db
      .query("classes")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .filter((q) => q.eq(q.field("subject"), subjectName))
      .collect();

    return {
      questions: questions.length,
      notes: notes.length,
      classes: classes.length,
    };
  },
});

export const remove = mutation({
  args: {
    id: v.id("subjects"),
  },
  handler: async (ctx, { id }) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const subject = await ctx.db.get(id);
    if (!subject) throw new Error("Subject not found");
    if (subject.organizationId !== orgId) throw new Error("Access denied");

    await ctx.db.delete(id);
  },
});
