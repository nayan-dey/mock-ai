import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireAdmin, getOrgId } from "./lib/auth";

// Get or create a conversation for the authenticated user
export const getOrCreateConversation = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    // Get the most recent conversation for this user
    const existing = await ctx.db
      .query("chatConversations")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    // If there's a recent conversation (within last 24 hours), use it
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (existing && existing.updatedAt > oneDayAgo) {
      return existing._id;
    }

    // Create a new conversation
    return await ctx.db.insert("chatConversations", {
      userId: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Add a message to a conversation
export const addMessage = mutation({
  args: {
    conversationId: v.id("chatConversations"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    suggestedLinks: v.optional(
      v.array(
        v.object({
          label: v.string(),
          href: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Verify ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.userId !== user._id) {
      throw new Error("You can only add messages to your own conversations");
    }

    // Server-side rate limit enforcement for user messages (skip for admins)
    if (args.role === "user" && user.role !== "admin") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const conversations = await ctx.db
        .query("chatConversations")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .collect();

      let todayCount = 0;
      for (const conv of conversations) {
        const messages = await ctx.db
          .query("chatMessages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .filter((q) =>
            q.and(
              q.eq(q.field("role"), "user"),
              q.gte(q.field("createdAt"), startOfDay.getTime())
            )
          )
          .collect();
        todayCount += messages.length;
      }

      if (todayCount >= 3) {
        throw new Error("Daily message limit reached. Please try again tomorrow.");
      }
    }

    // Update conversation timestamp
    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });

    // If this is the first user message, set the conversation title
    if (!conversation.title && args.role === "user") {
      const title = args.content.slice(0, 50) + (args.content.length > 50 ? "..." : "");
      await ctx.db.patch(args.conversationId, { title });
    }

    return await ctx.db.insert("chatMessages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      suggestedLinks: args.suggestedLinks,
      createdAt: Date.now(),
    });
  },
});

// Get all messages for a conversation
export const getMessages = query({
  args: { conversationId: v.id("chatConversations") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Verify ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.userId !== user._id) {
      throw new Error("You can only view your own conversations");
    }

    return await ctx.db
      .query("chatMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();
  },
});

// Get user's conversations (derived from auth)
export const getUserConversations = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    return await ctx.db
      .query("chatConversations")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);
  },
});

// Delete a conversation and its messages
export const deleteConversation = mutation({
  args: { conversationId: v.id("chatConversations") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Verify ownership
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.userId !== user._id) {
      throw new Error("You can only delete your own conversations");
    }

    // Delete all messages first
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the conversation
    await ctx.db.delete(args.conversationId);
  },
});

// Get user's daily message count (for rate limiting display)
export const getDailyMessageCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const conversations = await ctx.db
      .query("chatConversations")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();

    let count = 0;
    for (const conv of conversations) {
      const messages = await ctx.db
        .query("chatMessages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("role"), "user"),
            q.gte(q.field("createdAt"), startOfDay.getTime())
          )
        )
        .collect();
      count += messages.length;
    }

    return {
      count,
      limit: 3,
      remaining: Math.max(0, 3 - count),
      hasReachedLimit: count >= 3,
    };
  },
});

// Get comprehensive admin context for AI
export const getAdminContext = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    // Get org info
    const org = await ctx.db.get(orgId);

    // Parallel fetch: users, batches, fees, tests
    const [allUsers, batches, allFees, allTests] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect(),
      ctx.db
        .query("batches")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect(),
      ctx.db
        .query("fees")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect(),
      ctx.db
        .query("tests")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect(),
    ]);

    const students = allUsers.filter((u) => u.role === "student" && !u.isSuspended);

    // Build a student lookup map from already-fetched users (avoid N+1)
    const userMap = new Map(allUsers.map((u) => [u._id as string, u]));
    const batchMap = new Map(batches.map((b) => [b._id as string, b]));

    // Batch student counts
    const batchSummary = batches.map((b) => ({
      name: b.name,
      isActive: b.isActive,
      studentCount: students.filter((s) => s.batchId === b._id).length,
    }));

    // Fee summary — use userMap instead of fetching per fee
    const dueFees = allFees.filter((f) => f.status === "due");
    const totalDueAmount = dueFees.reduce((sum, f) => sum + f.amount, 0);

    const batchFeeBreakdown: Record<string, { dueCount: number; dueAmount: number }> = {};
    for (const fee of dueFees) {
      const student = userMap.get(fee.studentId as string);
      const batchName = student?.batchId
        ? batchMap.get(student.batchId as string)?.name || "No Batch"
        : "No Batch";
      if (!batchFeeBreakdown[batchName]) {
        batchFeeBreakdown[batchName] = { dueCount: 0, dueAmount: 0 };
      }
      batchFeeBreakdown[batchName].dueCount++;
      batchFeeBreakdown[batchName].dueAmount += fee.amount;
    }

    // Students with due fees — use userMap
    const studentsWithDueFees = dueFees.slice(0, 50).map((fee) => {
      const student = userMap.get(fee.studentId as string);
      return {
        studentName: student?.name || "Unknown",
        amount: fee.amount,
        dueDate: new Date(fee.dueDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
    });

    const publishedTests = allTests.filter((t) => t.status === "published");
    const testMap = new Map(allTests.map((t) => [t._id as string, t]));

    // Fetch attempts only for org's tests using indexed queries in parallel
    const testAttemptsList = await Promise.all(
      allTests.slice(0, 20).map((test) =>
        ctx.db
          .query("attempts")
          .withIndex("by_test_id", (q) => q.eq("testId", test._id))
          .filter((q) => q.eq(q.field("status"), "submitted"))
          .collect()
      )
    );

    // Per-test summary
    const testSummary = allTests.slice(0, 20).map((test, i) => {
      const attempts = testAttemptsList[i];
      const avgScore =
        attempts.length > 0
          ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
          : 0;
      return {
        title: test.title,
        status: test.status,
        attemptCount: attempts.length,
        avgScore: Math.round(avgScore * 10) / 10,
        totalMarks: test.totalMarks,
      };
    });

    // Collect all org attempts from the per-test fetches (avoids full table scan)
    const studentIds = new Set(students.map((s) => s._id as string));
    const allOrgAttempts = testAttemptsList.flat().filter((a) => studentIds.has(a.userId as string));

    // Top 5 students by total score — use userMap
    const userScores: Record<string, number> = {};
    for (const attempt of allOrgAttempts) {
      const id = attempt.userId as string;
      userScores[id] = (userScores[id] || 0) + attempt.score;
    }

    const topStudents = Object.entries(userScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([userId, totalScore]) => ({
        name: userMap.get(userId)?.name || "Unknown",
        totalScore,
      }));

    // Recent activity — use userMap + testMap
    const recentAttempts = allOrgAttempts
      .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0))
      .slice(0, 10);

    const recentActivity = recentAttempts.map((attempt) => {
      const student = userMap.get(attempt.userId as string);
      const test = testMap.get(attempt.testId as string);
      return {
        studentName: student?.name || "Unknown",
        testName: test?.title || "Unknown Test",
        score: attempt.score,
        totalMarks: test?.totalMarks || 0,
        submittedAt: attempt.submittedAt
          ? new Date(attempt.submittedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          : "N/A",
      };
    });

    return {
      orgName: org?.name || "Your Organization",
      totalStudents: students.length,
      totalBatches: batches.length,
      batchSummary,
      feeSummary: {
        totalDueCount: dueFees.length,
        totalDueAmount,
        batchBreakdown: batchFeeBreakdown,
        studentsWithDueFees,
      },
      testSummary: {
        totalTests: allTests.length,
        publishedCount: publishedTests.length,
        tests: testSummary,
      },
      topStudents,
      recentActivity,
    };
  },
});

// Get comprehensive student context for AI
export const getStudentContext = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    // Get batch info
    const batch = user.batchId ? await ctx.db.get(user.batchId) : null;

    // Get all submitted attempts
    const rawAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    // Get tests for the attempts
    const testIds = [...new Set(rawAttempts.map((a) => a.testId))];
    const tests = await Promise.all(testIds.map((id) => ctx.db.get(id)));
    const testsMap = new Map(tests.filter(Boolean).map((t) => [t!._id, t!]));

    // Filter to only include attempts where answer key is published
    const attempts = rawAttempts.filter((a) => {
      const test = testsMap.get(a.testId);
      return test?.answerKeyPublished === true;
    });

    // Calculate analytics
    const totalCorrect = attempts.reduce((sum, a) => sum + a.correct, 0);
    const totalIncorrect = attempts.reduce((sum, a) => sum + a.incorrect, 0);
    const totalUnanswered = attempts.reduce((sum, a) => sum + a.unanswered, 0);
    const totalQuestions = totalCorrect + totalIncorrect + totalUnanswered;
    const avgAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);

    // Recent attempts (last 5)
    const recentAttempts = attempts
      .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0))
      .slice(0, 5)
      .map((attempt) => {
        const test = testsMap.get(attempt.testId);
        return {
          testTitle: test?.title || "Unknown Test",
          score: attempt.score,
          totalMarks: test?.totalMarks || 0,
          correct: attempt.correct,
          incorrect: attempt.incorrect,
          unanswered: attempt.unanswered,
          submittedAt: attempt.submittedAt,
        };
      });

    return {
      profile: {
        name: user.name,
        bio: user.bio,
        batchName: batch?.name || null,
        joinedAt: user.createdAt,
      },
      analytics: {
        totalTestsTaken: attempts.length,
        totalScore,
        avgAccuracy: Math.round(avgAccuracy * 10) / 10,
        totalCorrect,
        totalIncorrect,
        totalUnanswered,
      },
      recentAttempts,
    };
  },
});
