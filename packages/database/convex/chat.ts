import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";

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

    // Server-side rate limit enforcement for user messages
    if (args.role === "user") {
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
