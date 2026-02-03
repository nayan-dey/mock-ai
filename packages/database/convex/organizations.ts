import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireAuth, getOrgId } from "./lib/auth";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    logoUrl: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    contactEmail: v.optional(v.string()),
    phone: v.string(),
    address: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const identity = await ctx.auth.getUserIdentity();
    const adminClerkId = identity!.subject;

    // Check if this admin already belongs to an org via orgAdmins
    const existingAdmin = await ctx.db
      .query("orgAdmins")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", adminClerkId))
      .first();

    if (existingAdmin) {
      return existingAdmin.organizationId;
    }

    // Also check legacy adminClerkId field
    const existingOrg = await ctx.db
      .query("organizations")
      .withIndex("by_admin_clerk_id", (q) =>
        q.eq("adminClerkId", adminClerkId)
      )
      .first();

    if (existingOrg) {
      // Backfill orgAdmins entry
      await ctx.db.insert("orgAdmins", {
        clerkId: adminClerkId,
        organizationId: existingOrg._id,
        isSuperAdmin: true,
        createdAt: Date.now(),
      });
      return existingOrg._id;
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
      logoStorageId: args.logoStorageId,
      contactEmail: args.contactEmail,
      phone: args.phone,
      address: args.address,
      adminClerkId,
      isVerified: false,
      createdAt: Date.now(),
    });

    // Insert into orgAdmins junction table (founding admin = super admin)
    await ctx.db.insert("orgAdmins", {
      clerkId: adminClerkId,
      organizationId: orgId,
      isSuperAdmin: true,
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Check orgAdmins junction table first
    const adminEntry = await ctx.db
      .query("orgAdmins")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.adminClerkId))
      .first();

    if (adminEntry) {
      return await ctx.db.get(adminEntry.organizationId);
    }

    // Fallback to legacy adminClerkId field
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
    logoStorageId: v.optional(v.id("_storage")),
    contactEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const org = await ctx.db.get(args.id);
    if (!org) throw new Error("Organization not found");

    const identity = await ctx.auth.getUserIdentity();
    const clerkId = identity!.subject;

    // Verify this admin belongs to this org
    const adminEntry = await ctx.db
      .query("orgAdmins")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    const isAdmin =
      (adminEntry && adminEntry.organizationId === args.id) ||
      org.adminClerkId === clerkId;

    if (!isAdmin) {
      throw new Error("You can only update your own organization");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

// List all admins for the current org
export const listAdmins = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const admins = await ctx.db
      .query("orgAdmins")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();

    // Enrich with user data
    return Promise.all(
      admins.map(async (a) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", a.clerkId))
          .first();
        return {
          _id: a._id,
          clerkId: a.clerkId,
          isSuperAdmin: a.isSuperAdmin,
          createdAt: a.createdAt,
          userName: user?.name ?? "Unknown",
          userEmail: user?.email ?? "",
          userId: user?._id,
        };
      })
    );
  },
});

// Remove an admin from the org (super admin only)
export const removeAdmin = mutation({
  args: {
    orgAdminId: v.id("orgAdmins"),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const identity = await ctx.auth.getUserIdentity();
    const callerClerkId = identity!.subject;

    // Verify caller is super admin
    const callerOrgAdmin = await ctx.db
      .query("orgAdmins")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", callerClerkId))
      .first();

    if (!callerOrgAdmin || !callerOrgAdmin.isSuperAdmin) {
      throw new Error("Only the super admin can remove other admins");
    }

    const targetAdmin = await ctx.db.get(args.orgAdminId);
    if (!targetAdmin) throw new Error("Admin not found");
    if (targetAdmin.organizationId !== orgId) {
      throw new Error("Admin does not belong to your organization");
    }
    if (targetAdmin.isSuperAdmin) {
      throw new Error("Cannot remove the super admin");
    }

    // Remove the orgAdmins entry
    await ctx.db.delete(args.orgAdminId);

    // Clear the user's organizationId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", targetAdmin.clerkId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, { organizationId: undefined });
    }
  },
});

// Generate upload URL for org logo
export const generateLogoUploadUrl = mutation({
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Get current admin's organization with resolved logo URL
export const getMyOrg = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const org = await ctx.db.get(orgId);
    if (!org) return null;

    const resolvedLogoUrl = org.logoStorageId
      ? await ctx.storage.getUrl(org.logoStorageId)
      : org.logoUrl ?? null;

    return { ...org, resolvedLogoUrl };
  },
});

// Check if current user is super admin
export const isSuperAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const adminEntry = await ctx.db
      .query("orgAdmins")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return adminEntry?.isSuperAdmin ?? false;
  },
});

// Public query — no auth required, used by student onboarding
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db.query("organizations").collect();
    return Promise.all(
      orgs.map(async (org) => {
        const resolvedLogoUrl = org.logoStorageId
          ? await ctx.storage.getUrl(org.logoStorageId)
          : org.logoUrl ?? null;
        return {
          _id: org._id,
          name: org.name,
          slug: org.slug,
          logoUrl: resolvedLogoUrl,
        };
      })
    );
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
    const resolvedLogoUrl = org.logoStorageId
      ? await ctx.storage.getUrl(org.logoStorageId)
      : org.logoUrl ?? null;
    return {
      _id: org._id,
      name: org.name,
      slug: org.slug,
      logoUrl: resolvedLogoUrl,
    };
  },
});
