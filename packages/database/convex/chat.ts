import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get or create a conversation for a user
export const getOrCreateConversation = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get the most recent conversation for this user
    const existing = await ctx.db
      .query("chatConversations")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();

    // If there's a recent conversation (within last 24 hours), use it
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (existing && existing.updatedAt > oneDayAgo) {
      return existing._id;
    }

    // Create a new conversation
    return await ctx.db.insert("chatConversations", {
      userId: args.userId,
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
    // Update conversation timestamp
    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });

    // If this is the first user message, set the conversation title
    const conversation = await ctx.db.get(args.conversationId);
    if (conversation && !conversation.title && args.role === "user") {
      // Use first 50 chars of the message as title
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
    return await ctx.db
      .query("chatMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();
  },
});

// Get user's conversations
export const getUserConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatConversations")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10);
  },
});

// Delete a conversation and its messages
export const deleteConversation = mutation({
  args: { conversationId: v.id("chatConversations") },
  handler: async (ctx, args) => {
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

// Get user's daily message count (for rate limiting)
export const getDailyMessageCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Get all user conversations
    const conversations = await ctx.db
      .query("chatConversations")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Count messages from today
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
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get user profile
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Get batch info
    const batch = user.batchId ? await ctx.db.get(user.batchId) : null;

    // Get all submitted attempts
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    // Get tests for the attempts
    const testIds = [...new Set(attempts.map((a) => a.testId))];
    const tests = await Promise.all(testIds.map((id) => ctx.db.get(id)));
    const testsMap = new Map(tests.filter(Boolean).map((t) => [t!._id, t!]));

    // Calculate analytics
    const totalCorrect = attempts.reduce((sum, a) => sum + a.correct, 0);
    const totalIncorrect = attempts.reduce((sum, a) => sum + a.incorrect, 0);
    const totalUnanswered = attempts.reduce((sum, a) => sum + a.unanswered, 0);
    const totalQuestions = totalCorrect + totalIncorrect + totalUnanswered;
    const avgAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);

    // Subject-wise performance
    const subjectPerformance: Record<string, { correct: number; total: number; accuracy: number }> = {};

    // Collect all question IDs
    const allQuestionIds = new Set<Id<"questions">>();
    for (const test of tests) {
      if (test) {
        for (const qId of test.questions) {
          allQuestionIds.add(qId);
        }
      }
    }

    // Fetch all questions
    const questions = await Promise.all(
      Array.from(allQuestionIds).map((id) => ctx.db.get(id))
    );
    const questionsMap = new Map(
      questions.filter(Boolean).map((q) => [q!._id as string, q!])
    );

    // Calculate subject performance
    for (const attempt of attempts) {
      const test = testsMap.get(attempt.testId);
      if (!test) continue;

      for (const questionId of test.questions) {
        const question = questionsMap.get(questionId as string);
        if (!question) continue;

        const subject = question.subject;
        if (!subjectPerformance[subject]) {
          subjectPerformance[subject] = { correct: 0, total: 0, accuracy: 0 };
        }

        subjectPerformance[subject].total++;

        const answer = attempt.answers.find((a) => a.questionId === questionId);
        if (answer) {
          const isCorrect =
            answer.selected.length === question.correctOptions.length &&
            answer.selected.every((s) => question.correctOptions.includes(s)) &&
            question.correctOptions.every((c) => answer.selected.includes(c));
          if (isCorrect) {
            subjectPerformance[subject].correct++;
          }
        }
      }
    }

    // Calculate accuracy for each subject
    for (const subject in subjectPerformance) {
      const perf = subjectPerformance[subject];
      perf.accuracy = perf.total > 0 ? (perf.correct / perf.total) * 100 : 0;
    }

    // Sort subjects by accuracy (weakest first)
    const sortedSubjects = Object.entries(subjectPerformance)
      .sort(([, a], [, b]) => a.accuracy - b.accuracy)
      .map(([subject, data]) => ({
        subject,
        ...data,
      }));

    // Get leaderboard position
    const allAttempts = await ctx.db
      .query("attempts")
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    const userScores: Record<string, number> = {};
    for (const attempt of allAttempts) {
      const id = attempt.userId as string;
      userScores[id] = (userScores[id] || 0) + attempt.score;
    }

    const sortedByScore = Object.entries(userScores).sort(([, a], [, b]) => b - a);
    const rank = sortedByScore.findIndex(([id]) => id === (args.userId as string)) + 1;
    const totalStudents = sortedByScore.length;

    // Recent attempts (last 5)
    const recentAttempts = await Promise.all(
      attempts
        .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0))
        .slice(0, 5)
        .map(async (attempt) => {
          const test = testsMap.get(attempt.testId);
          return {
            testTitle: test?.title || "Unknown Test",
            testId: attempt.testId,
            score: attempt.score,
            totalMarks: test?.totalMarks || 0,
            correct: attempt.correct,
            incorrect: attempt.incorrect,
            unanswered: attempt.unanswered,
            submittedAt: attempt.submittedAt,
          };
        })
    );

    // Get available tests (published, not yet attempted)
    const publishedTests = await ctx.db
      .query("tests")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    const attemptedTestIds = new Set(attempts.map((a) => a.testId as string));
    const availableTests = publishedTests
      .filter((test) => {
        // Filter by batch
        if (test.batchIds && test.batchIds.length > 0) {
          if (!user.batchId || !test.batchIds.includes(user.batchId)) {
            return false;
          }
        }
        // Filter out already attempted
        return !attemptedTestIds.has(test._id as string);
      })
      .map((test) => ({
        id: test._id,
        title: test.title,
        duration: test.duration,
        totalMarks: test.totalMarks,
      }));

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
      leaderboard: {
        rank,
        totalStudents,
        percentile: totalStudents > 0 ? Math.round((1 - rank / totalStudents) * 100) : 0,
      },
      subjectPerformance: sortedSubjects,
      recentAttempts,
      availableTests: availableTests.slice(0, 5),
      attemptedTestIds: Array.from(attemptedTestIds),
    };
  },
});
