import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    adminClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if org already exists for this admin
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_admin_clerk_id", (q) =>
        q.eq("adminClerkId", args.adminClerkId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("organizations", {
      name: args.name,
      description: args.description,
      logoUrl: args.logoUrl,
      contactEmail: args.contactEmail,
      phone: args.phone,
      address: args.address,
      adminClerkId: args.adminClerkId,
      createdAt: Date.now(),
    });
  },
});

export const getByAdminClerkId = query({
  args: { adminClerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_admin_clerk_id", (q) =>
        q.eq("adminClerkId", args.adminClerkId)
      )
      .first();
  },
});

export const update = mutation({
  args: {
    id: v.id("organizations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});
