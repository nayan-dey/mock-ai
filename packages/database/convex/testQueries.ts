import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireAdmin, getOrgId } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

// Create a new test query (student)
export const create = mutation({
  args: {
    testId: v.id("tests"),
    questionId: v.id("questions"),
    attemptId: v.optional(v.id("attempts")),
    type: v.union(
      v.literal("wrong_answer"),
      v.literal("wrong_question"),
      v.literal("wrong_options"),
      v.literal("unclear_question"),
      v.literal("other")
    ),
    subject: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    if (user.role !== "student") {
      throw new Error("Only students can create test queries");
    }

    const test = await ctx.db.get(args.testId);
    if (!test) {
      throw new Error("Test not found");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    // Verify question belongs to the test
    if (!test.questions.includes(args.questionId)) {
      throw new Error("Question does not belong to this test");
    }

    const queryId = await ctx.db.insert("testQueries", {
      testId: args.testId,
      questionId: args.questionId,
      attemptId: args.attemptId,
      studentId: user._id,
      organizationId: test.organizationId,
      type: args.type,
      subject: args.subject,
      description: args.description,
      status: "open",
      createdAt: Date.now(),
    });

    return queryId;
  },
});

// Get all test queries for the current student
export const getByStudent = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const queries = await ctx.db
      .query("testQueries")
      .withIndex("by_student", (q) => q.eq("studentId", user._id))
      .order("desc")
      .collect();

    // Enrich with test and question details
    const enrichedQueries = await Promise.all(
      queries.map(async (query) => {
        const test = await ctx.db.get(query.testId);
        const question = await ctx.db.get(query.questionId);

        return {
          ...query,
          testTitle: test?.title || "Unknown Test",
          questionText: question?.text || "Unknown Question",
          questionOptions: question?.options || [],
        };
      })
    );

    return enrichedQueries;
  },
});

// Get all test queries for organization (admin)
export const getAllForOrg = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const queries = await ctx.db
      .query("testQueries")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .order("desc")
      .collect();

    // Enrich with details
    const enrichedQueries = await Promise.all(
      queries.map(async (query) => {
        const student = await ctx.db.get(query.studentId);
        const test = await ctx.db.get(query.testId);
        const question = await ctx.db.get(query.questionId);
        const resolver = query.resolvedBy ? await ctx.db.get(query.resolvedBy) : null;
        // Get batch info
        let batchName = null;
        if (student?.batchId) {
          const batch = await ctx.db.get(student.batchId);
          batchName = batch?.name || null;
        }

        return {
          ...query,
          _id: query._id as string,
          studentName: student?.name || "Unknown",
          studentEmail: student?.email || "",
          studentBatchName: batchName,
          testTitle: test?.title || "Unknown Test",
          questionText: question?.text || "Unknown Question",
          questionOptions: question?.options || [],
          correctOptions: question?.correctOptions || [],
          resolverName: resolver?.name || null,
        };
      })
    );

    return enrichedQueries;
  },
});

// Get a single test query by ID
export const getById = query({
  args: { id: v.id("testQueries") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const query = await ctx.db.get(args.id);

    if (!query) return null;

    // Check access
    if (user.role === "admin") {
      const orgId = getOrgId(user);
      if (query.organizationId !== orgId) {
        return null;
      }
    } else if (query.studentId !== user._id) {
      return null;
    }

    const student = await ctx.db.get(query.studentId);
    const test = await ctx.db.get(query.testId);
    const question = await ctx.db.get(query.questionId);
    const resolver = query.resolvedBy ? await ctx.db.get(query.resolvedBy) : null;
    // Get batch info
    let batchName = null;
    if (student?.batchId) {
      const batch = await ctx.db.get(student.batchId);
      batchName = batch?.name || null;
    }

    return {
      ...query,
      studentName: student?.name || "Unknown",
      studentEmail: student?.email || "",
      studentBatchName: batchName,
      testTitle: test?.title || "Unknown Test",
      questionText: question?.text || "Unknown Question",
      questionOptions: question?.options || [],
      correctOptions: question?.correctOptions || [],
      explanation: question?.explanation || null,
      resolverName: resolver?.name || null,
    };
  },
});

// Update test query status (admin only)
export const updateStatus = mutation({
  args: {
    queryId: v.id("testQueries"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("rejected"),
      v.literal("closed")
    ),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const query = await ctx.db.get(args.queryId);
    if (!query) {
      throw new Error("Query not found");
    }

    if (query.organizationId !== orgId) {
      throw new Error("Access denied");
    }

    const updates: any = {
      status: args.status,
    };

    if (args.status === "resolved" || args.status === "rejected" || args.status === "closed") {
      updates.resolvedBy = admin._id;
      updates.resolvedAt = Date.now();
    }

    if (args.adminNote) {
      updates.adminNote = args.adminNote;
    }

    await ctx.db.patch(args.queryId, updates);
  },
});

// Get messages for a test query
export const getMessages = query({
  args: { queryId: v.id("testQueries") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const query = await ctx.db.get(args.queryId);
    if (!query) {
      throw new Error("Query not found");
    }

    // Check access
    if (user.role === "admin") {
      const orgId = getOrgId(user);
      if (query.organizationId !== orgId) {
        throw new Error("Access denied");
      }
    } else if (query.studentId !== user._id) {
      throw new Error("Access denied");
    }

    const messages = await ctx.db
      .query("testQueryMessages")
      .withIndex("by_query_created", (q) => q.eq("queryId", args.queryId))
      .order("asc")
      .collect();

    return messages;
  },
});

// Add a message to a test query thread
export const addMessage = mutation({
  args: {
    queryId: v.id("testQueries"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const query = await ctx.db.get(args.queryId);
    if (!query) {
      throw new Error("Query not found");
    }

    // Check access
    if (user.role === "admin") {
      const orgId = getOrgId(user);
      if (query.organizationId !== orgId) {
        throw new Error("Access denied");
      }
    } else if (query.studentId !== user._id) {
      throw new Error("Access denied");
    }

    // Don't allow messages on closed/resolved/rejected queries
    if (["closed", "resolved", "rejected"].includes(query.status)) {
      throw new Error("Cannot send messages on a closed query");
    }

    const messageId = await ctx.db.insert("testQueryMessages", {
      queryId: args.queryId,
      senderId: user._id,
      senderRole: user.role === "admin" ? "admin" : "student",
      senderName: user.name,
      message: args.message,
      createdAt: Date.now(),
    });

    // Update status to in_progress if admin responds to an open query
    if (user.role === "admin" && query.status === "open") {
      await ctx.db.patch(args.queryId, { status: "in_progress" });
    }

    return messageId;
  },
});
