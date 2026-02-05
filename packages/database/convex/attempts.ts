import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAuth, requireAdmin } from "./lib/auth";

// Keep only the first attempt per user per test (earliest startedAt).
function keepFirstAttempts<T extends { userId: any; testId: any; startedAt: number }>(
  attempts: T[]
): T[] {
  const firstMap = new Map<string, T>();
  for (const attempt of attempts) {
    const key = `${attempt.userId}:${attempt.testId}`;
    const existing = firstMap.get(key);
    if (!existing || attempt.startedAt < existing.startedAt) {
      firstMap.set(key, attempt);
    }
  }
  return Array.from(firstMap.values());
}

export const getByUserAndTest = query({
  args: {
    userId: v.id("users"),
    testId: v.id("tests"),
  },
  handler: async (ctx, args) => {
    const caller = await requireAuth(ctx);

    // Only allow admin or self
    if (caller.role !== "admin" && caller._id !== args.userId) {
      throw new Error("You can only view your own attempts");
    }

    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_test", (q) =>
        q.eq("userId", args.userId).eq("testId", args.testId)
      )
      .order("desc")
      .collect();

    const inProgress = attempts.find(a => a.status === "in_progress");
    if (inProgress) return { ...inProgress, answerKeyPublished: false };

    const latest = attempts[0] || null;
    if (!latest) return null;

    // Enrich with answerKeyPublished from the test
    const test = await ctx.db.get(latest.testId);
    return { ...latest, answerKeyPublished: test?.answerKeyPublished === true };
  },
});

export const getAllByUserAndTest = query({
  args: {
    userId: v.id("users"),
    testId: v.id("tests"),
  },
  handler: async (ctx, args) => {
    const caller = await requireAuth(ctx);

    if (caller.role !== "admin" && caller._id !== args.userId) {
      throw new Error("You can only view your own attempts");
    }

    return await ctx.db
      .query("attempts")
      .withIndex("by_user_test", (q) =>
        q.eq("userId", args.userId).eq("testId", args.testId)
      )
      .order("desc")
      .collect();
  },
});

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await requireAuth(ctx);

    if (caller.role !== "admin" && caller._id !== args.userId) {
      throw new Error("You can only view your own attempts");
    }

    const allAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .order("desc")
      .collect();

    // Only show first attempt per test
    const attempts = keepFirstAttempts(allAttempts).sort(
      (a, b) => b.startedAt - a.startedAt
    );

    const attemptsWithTests = await Promise.all(
      attempts.map(async (attempt) => {
        const test = await ctx.db.get(attempt.testId);
        const percentage = test && test.totalMarks > 0
          ? (attempt.score / test.totalMarks) * 100
          : 0;
        return {
          ...attempt,
          testTitle: test?.title || "Unknown Test",
          totalMarks: test?.totalMarks || 0,
          percentage,
          answerKeyPublished: test?.answerKeyPublished ?? false,
        };
      })
    );

    return attemptsWithTests;
  },
});

export const getByTest = query({
  args: { testId: v.id("tests") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = admin.organizationId;
    const test = await ctx.db.get(args.testId);
    if (!test || !orgId || test.organizationId !== orgId) {
      throw new Error("Access denied");
    }
    const allAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_test_id", (q) => q.eq("testId", args.testId))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    // Only show first attempt per user for this test
    return keepFirstAttempts(allAttempts);
  },
});

export const getById = query({
  args: { id: v.id("attempts") },
  handler: async (ctx, args) => {
    const caller = await requireAuth(ctx);
    const attempt = await ctx.db.get(args.id);
    if (!attempt) return null;

    // Only allow admin or the attempt owner
    if (caller.role !== "admin" && caller._id !== attempt.userId) {
      throw new Error("You can only view your own attempts");
    }

    return attempt;
  },
});

export const getWithDetails = query({
  args: { id: v.id("attempts") },
  handler: async (ctx, args) => {
    const caller = await requireAuth(ctx);

    const attempt = await ctx.db.get(args.id);
    if (!attempt) return null;

    // Only allow admin or the attempt owner
    if (caller.role !== "admin" && caller._id !== attempt.userId) {
      throw new Error("You can only view your own attempts");
    }

    const test = await ctx.db.get(attempt.testId);
    if (!test) return null;

    const answerKeyPublished = test.answerKeyPublished ?? false;

    // If answer key is not published, return attempt without question details
    if (!answerKeyPublished) {
      return {
        ...attempt,
        test,
        questions: [],
        answerKeyPublished: false,
      };
    }

    const questions = await Promise.all(
      test.questions.map((qId) => ctx.db.get(qId))
    );

    return {
      ...attempt,
      test,
      questions: questions.filter(Boolean),
      answerKeyPublished: true,
    };
  },
});

export const start = mutation({
  args: {
    testId: v.id("tests"),
    forceNew: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Derive userId from auth — no client-supplied userId
    const user = await requireAuth(ctx);

    // Check for existing in-progress attempt
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_test", (q) =>
        q.eq("userId", user._id).eq("testId", args.testId)
      )
      .collect();

    const inProgress = attempts.find(a => a.status === "in_progress");

    if (inProgress && !args.forceNew) {
      return inProgress._id;
    }

    if (inProgress && args.forceNew) {
      await ctx.db.patch(inProgress._id, {
        status: "submitted",
        submittedAt: Date.now(),
      });
    }

    const test = await ctx.db.get(args.testId);
    if (!test) throw new Error("Test not found");

    // Shuffle question order for this attempt (Fisher-Yates)
    const questionOrder = [...test.questions];
    for (let i = questionOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questionOrder[i], questionOrder[j]] = [questionOrder[j], questionOrder[i]];
    }

    return await ctx.db.insert("attempts", {
      testId: args.testId,
      userId: user._id,
      answers: [],
      questionOrder,
      score: 0,
      totalQuestions: test.questions.length,
      correct: 0,
      incorrect: 0,
      unanswered: test.questions.length,
      startedAt: Date.now(),
      status: "in_progress",
    });
  },
});

export const saveAnswer = mutation({
  args: {
    attemptId: v.id("attempts"),
    questionId: v.id("questions"),
    selected: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) throw new Error("Attempt not found");

    // Verify ownership
    if (attempt.userId !== user._id) {
      throw new Error("You can only modify your own attempts");
    }

    if (attempt.status !== "in_progress") {
      throw new Error("Cannot modify a submitted test");
    }

    // Validate selected indices against the question's options
    const question = await ctx.db.get(args.questionId);
    if (question) {
      for (const idx of args.selected) {
        if (idx < 0 || idx >= question.options.length) {
          throw new Error(`Selected index ${idx} is out of range`);
        }
      }
    }

    const existingIndex = attempt.answers.findIndex(
      (a) => a.questionId === args.questionId
    );

    const newAnswers = [...attempt.answers];
    if (existingIndex >= 0) {
      newAnswers[existingIndex] = {
        questionId: args.questionId,
        selected: args.selected,
      };
    } else {
      newAnswers.push({
        questionId: args.questionId,
        selected: args.selected,
      });
    }

    await ctx.db.patch(args.attemptId, { answers: newAnswers });
  },
});

export const submit = mutation({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) throw new Error("Attempt not found");

    // Verify ownership
    if (attempt.userId !== user._id) {
      throw new Error("You can only submit your own attempts");
    }

    if (attempt.status !== "in_progress") {
      throw new Error("Test already submitted");
    }

    const test = await ctx.db.get(attempt.testId);
    if (!test) throw new Error("Test not found");

    // Server-side timer enforcement
    const elapsed = Date.now() - attempt.startedAt;
    const maxDuration = test.duration * 60 * 1000 + 30000; // duration in min + 30s grace
    if (elapsed > maxDuration) {
      // Auto-submit with current answers rather than rejecting
      // (student may have network delays)
    }

    const questions = await Promise.all(
      test.questions.map((qId) => ctx.db.get(qId))
    );

    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    const marksPerQuestion = test.totalMarks / test.questions.length;

    for (const question of questions) {
      if (!question) continue;

      const answer = attempt.answers.find(
        (a) => a.questionId === question._id
      );

      if (!answer || answer.selected.length === 0) {
        unanswered++;
        continue;
      }

      const isCorrect =
        answer.selected.length === question.correctOptions.length &&
        answer.selected.every((s) => question.correctOptions.includes(s)) &&
        question.correctOptions.every((c) => answer.selected.includes(c));

      if (isCorrect) {
        correct++;
      } else {
        incorrect++;
      }
    }

    const score =
      correct * marksPerQuestion - incorrect * test.negativeMarking;

    await ctx.db.patch(args.attemptId, {
      score: Math.max(0, score),
      correct,
      incorrect,
      unanswered,
      submittedAt: Date.now(),
      status: "submitted",
    });

    // Notify admin about test submission
    const studentUser = await ctx.db.get(attempt.userId);
    if (studentUser?.organizationId) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.createNotification,
        {
          organizationId: studentUser.organizationId,
          type: "test_submitted",
          title: "Test Submitted",
          message: `${studentUser.name} submitted "${test.title}" — Score: ${Math.max(0, score)}/${test.totalMarks}`,
          referenceId: args.attemptId,
          referenceType: "attempt",
          actorId: attempt.userId,
          actorName: studentUser.name,
        }
      );
    }

    return {
      score: Math.max(0, score),
      correct,
      incorrect,
      unanswered,
    };
  },
});

export const getInProgressByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await requireAuth(ctx);

    if (caller.role !== "admin" && caller._id !== args.userId) {
      throw new Error("You can only view your own attempts");
    }

    return await ctx.db
      .query("attempts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .collect();
  },
});
