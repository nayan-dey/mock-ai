import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin, requireAuth, getOrgId } from "./lib/auth";

const queryType = v.union(
  v.literal("dispute"),
  v.literal("clarification"),
  v.literal("payment_issue"),
  v.literal("extension_request"),
  v.literal("other")
);

const queryStatus = v.union(
  v.literal("open"),
  v.literal("in_progress"),
  v.literal("resolved"),
  v.literal("closed")
);

// Student creates a query about a fee
export const create = mutation({
  args: {
    feeId: v.id("fees"),
    type: queryType,
    subject: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Verify fee belongs to this student
    const fee = await ctx.db.get(args.feeId);
    if (!fee || fee.studentId !== user._id) {
      throw new Error("Fee not found or access denied");
    }

    // Validate input
    if (!args.subject.trim()) {
      throw new Error("Subject is required");
    }
    if (!args.description.trim()) {
      throw new Error("Description is required");
    }
    if (args.subject.length > 100) {
      throw new Error("Subject must be 100 characters or less");
    }
    if (args.description.length > 500) {
      throw new Error("Description must be 500 characters or less");
    }

    const queryId = await ctx.db.insert("feeQueries", {
      feeId: args.feeId,
      studentId: user._id,
      organizationId: fee.organizationId,
      type: args.type,
      subject: args.subject.trim(),
      description: args.description.trim(),
      status: "open",
      createdAt: Date.now(),
    });

    // Notify admins/teachers about the new query
    await ctx.scheduler.runAfter(
      0,
      internal.notifications.createNotification,
      {
        organizationId: fee.organizationId,
        type: "fee_query",
        title: "New Fee Query",
        message: `${user.name} raised a ${args.type.replace("_", " ")} query: "${args.subject}"`,
        referenceId: queryId,
        referenceType: "feeQuery",
        actorId: user._id,
        actorName: user.name,
      }
    );

    return queryId;
  },
});

// Get queries for a specific fee (student or admin)
export const getByFee = query({
  args: { feeId: v.id("fees") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const fee = await ctx.db.get(args.feeId);

    if (!fee) return [];

    // Students can only see their own fee queries
    if (user.role !== "admin" && fee.studentId !== user._id) {
      return [];
    }

    const queries = await ctx.db
      .query("feeQueries")
      .withIndex("by_fee", (q) => q.eq("feeId", args.feeId))
      .collect();

    // Enrich with resolver info if resolved
    return Promise.all(
      queries.map(async (query) => {
        let resolverName = null;
        if (query.resolvedBy) {
          const resolver = await ctx.db.get(query.resolvedBy);
          resolverName = resolver?.name ?? "Unknown";
        }
        return {
          ...query,
          resolverName,
        };
      })
    );
  },
});

// Get all queries for a student
export const getByStudent = query({
  args: { studentId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const studentId = args.studentId || user._id;

    // Students can only see their own queries
    if (user.role !== "admin" && user._id !== studentId) {
      throw new Error("Access denied");
    }

    const queries = await ctx.db
      .query("feeQueries")
      .withIndex("by_student", (q) => q.eq("studentId", studentId))
      .collect();

    // Enrich with fee and resolver info
    return Promise.all(
      queries.map(async (query) => {
        const fee = await ctx.db.get(query.feeId);
        let resolverName = null;
        if (query.resolvedBy) {
          const resolver = await ctx.db.get(query.resolvedBy);
          resolverName = resolver?.name ?? "Unknown";
        }
        return {
          ...query,
          feeAmount: fee?.amount ?? 0,
          feeDueDate: fee?.dueDate,
          feeDescription: fee?.description,
          resolverName,
        };
      })
    );
  },
});

// Get all queries for admin's organization
export const getAllForOrg = query({
  args: {
    status: v.optional(queryStatus),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    let queries = await ctx.db
      .query("feeQueries")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();

    if (args.status) {
      queries = queries.filter((q) => q.status === args.status);
    }

    // Sort by creation date (newest first), then by status (open first)
    queries.sort((a, b) => {
      const statusOrder = { open: 0, in_progress: 1, resolved: 2, closed: 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.createdAt - a.createdAt;
    });

    // Enrich with student and fee data
    return Promise.all(
      queries.map(async (query) => {
        const student = await ctx.db.get(query.studentId);
        const fee = await ctx.db.get(query.feeId);
        let resolverName = null;
        if (query.resolvedBy) {
          const resolver = await ctx.db.get(query.resolvedBy);
          resolverName = resolver?.name ?? "Unknown";
        }
        return {
          ...query,
          studentName: student?.name ?? "Unknown",
          studentEmail: student?.email ?? "",
          feeAmount: fee?.amount ?? 0,
          feeDueDate: fee?.dueDate,
          feeDescription: fee?.description,
          resolverName,
        };
      })
    );
  },
});

// Get count of open queries for admin dashboard
export const getOpenCount = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const queries = await ctx.db
      .query("feeQueries")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .collect();

    return queries.filter((q) => q.status === "open" || q.status === "in_progress").length;
  },
});

// Admin updates query status
export const updateStatus = mutation({
  args: {
    queryId: v.id("feeQueries"),
    status: queryStatus,
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const query = await ctx.db.get(args.queryId);
    if (!query || query.organizationId !== orgId) {
      throw new Error("Query not found");
    }

    const updates: {
      status: typeof args.status;
      resolvedBy?: typeof admin._id;
      resolvedAt?: number;
    } = { status: args.status };

    if (args.status === "resolved" || args.status === "closed") {
      updates.resolvedBy = admin._id;
      updates.resolvedAt = Date.now();
    }

    await ctx.db.patch(args.queryId, updates);

    return { success: true };
  },
});

// Add a message to a query (both student and admin can use this)
export const addMessage = mutation({
  args: {
    queryId: v.id("feeQueries"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const query = await ctx.db.get(args.queryId);
    if (!query) {
      throw new Error("Query not found");
    }

    // Check access - student can only message their own queries, admin can message any in their org
    const isStudent = query.studentId === user._id;
    const isAdmin = user.role === "admin";

    if (!isStudent && !isAdmin) {
      throw new Error("Access denied");
    }

    if (isAdmin) {
      const orgId = getOrgId(user);
      if (query.organizationId !== orgId) {
        throw new Error("Access denied");
      }
    }

    // Validate message
    if (!args.message.trim()) {
      throw new Error("Message is required");
    }
    if (args.message.length > 1000) {
      throw new Error("Message must be 1000 characters or less");
    }

    // Add the message
    await ctx.db.insert("feeQueryMessages", {
      queryId: args.queryId,
      senderId: user._id,
      senderRole: isAdmin ? "admin" : "student",
      senderName: user.name,
      message: args.message.trim(),
      createdAt: Date.now(),
    });

    // If admin is replying and query is open, set to in_progress
    if (isAdmin && query.status === "open") {
      await ctx.db.patch(args.queryId, { status: "in_progress" });
    }

    // Notify the other party
    if (isAdmin) {
      // Notify student (we could add a student notification system later)
    } else {
      // Notify admin
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.createNotification,
        {
          organizationId: query.organizationId,
          type: "fee_query",
          title: "New Query Reply",
          message: `${user.name} replied to their fee query`,
          referenceId: args.queryId,
          referenceType: "feeQuery",
          actorId: user._id,
          actorName: user.name,
        }
      );
    }

    return { success: true };
  },
});

// Get messages for a query
export const getMessages = query({
  args: { queryId: v.id("feeQueries") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const query = await ctx.db.get(args.queryId);
    if (!query) return [];

    // Check access
    const isStudent = query.studentId === user._id;
    const isAdmin = user.role === "admin";

    if (!isStudent && !isAdmin) {
      return [];
    }

    if (isAdmin) {
      const orgId = getOrgId(user);
      if (query.organizationId !== orgId) {
        return [];
      }
    }

    const messages = await ctx.db
      .query("feeQueryMessages")
      .withIndex("by_query", (q) => q.eq("queryId", args.queryId))
      .collect();

    return messages.sort((a, b) => a.createdAt - b.createdAt);
  },
});

// Get a single query by ID
export const getById = query({
  args: { id: v.id("feeQueries") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const query = await ctx.db.get(args.id);

    if (!query) return null;

    // Check access - students can only see their own, admins can only see their org's
    if (user.role === "admin") {
      const orgId = getOrgId(user);
      if (query.organizationId !== orgId) {
        return null;
      }
    } else if (query.studentId !== user._id) {
      return null;
    }

    const student = await ctx.db.get(query.studentId);
    const fee = await ctx.db.get(query.feeId);
    let resolverName = null;
    if (query.resolvedBy) {
      const resolver = await ctx.db.get(query.resolvedBy);
      resolverName = resolver?.name ?? "Unknown";
    }

    return {
      ...query,
      studentName: student?.name ?? "Unknown",
      studentEmail: student?.email ?? "",
      feeAmount: fee?.amount ?? 0,
      feeDueDate: fee?.dueDate,
      feeDescription: fee?.description,
      resolverName,
    };
  },
});
