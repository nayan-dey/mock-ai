import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireAuth } from "./lib/auth";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    // Derive adminClerkId from auth token
    const identity = await ctx.auth.getUserIdentity();
    const adminClerkId = identity!.subject;

    // Check if org already exists for this admin
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_admin_clerk_id", (q) =>
        q.eq("adminClerkId", adminClerkId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Generate unique slug
    let slug = generateSlug(args.name);
    let slugSuffix = 0;
    while (true) {
      const candidateSlug = slugSuffix === 0 ? slug : `${slug}-${slugSuffix}`;
      const slugExists = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", candidateSlug))
        .first();
      if (!slugExists) {
        slug = candidateSlug;
        break;
      }
      slugSuffix++;
      if (slugSuffix > 100) {
        throw new Error("Unable to generate unique slug");
      }
    }

    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug,
      description: args.description,
      logoUrl: args.logoUrl,
      contactEmail: args.contactEmail,
      phone: args.phone,
      address: args.address,
      adminClerkId,
      createdAt: Date.now(),
    });

    // Set organizationId on the admin user
    await ctx.db.patch(admin._id, { organizationId: orgId });

    return orgId;
  },
});

export const getByAdminClerkId = query({
  args: { adminClerkId: v.string() },
  handler: async (ctx, args) => {
    // Gracefully handle missing auth — JWT may not be ready yet.
    // Convex will reactively re-run this query once the token arrives.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

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
    await requireAdmin(ctx);

    // Verify this admin owns this org
    const org = await ctx.db.get(args.id);
    if (!org) throw new Error("Organization not found");

    const identity = await ctx.auth.getUserIdentity();
    if (org.adminClerkId !== identity!.subject) {
      throw new Error("You can only update your own organization");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

// Public query — no auth required, used by student onboarding
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db.query("organizations").collect();
    return orgs.map((org) => ({
      _id: org._id,
      name: org.name,
      slug: org.slug,
      logoUrl: org.logoUrl,
    }));
  },
});

// Public query — lookup org by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!org) return null;
    return {
      _id: org._id,
      name: org.name,
      slug: org.slug,
      logoUrl: org.logoUrl,
    };
  },
});
