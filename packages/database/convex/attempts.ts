import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByUserAndTest = query({
  args: {
    userId: v.id("users"),
    testId: v.id("tests"),
  },
  handler: async (ctx, args) => {
    // Get all attempts for this user and test, ordered by most recent first
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_test", (q) =>
        q.eq("userId", args.userId).eq("testId", args.testId)
      )
      .order("desc")
      .collect();

    // Return in-progress attempt if exists, otherwise the most recent submitted one
    const inProgress = attempts.find(a => a.status === "in_progress");
    if (inProgress) return inProgress;

    return attempts[0] || null;
  },
});

export const getAllByUserAndTest = query({
  args: {
    userId: v.id("users"),
    testId: v.id("tests"),
  },
  handler: async (ctx, args) => {
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
    return await ctx.db
      .query("attempts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getByTest = query({
  args: { testId: v.id("tests") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attempts")
      .withIndex("by_test_id", (q) => q.eq("testId", args.testId))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("attempts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWithDetails = query({
  args: { id: v.id("attempts") },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.id);
    if (!attempt) return null;

    const test = await ctx.db.get(attempt.testId);
    if (!test) return null;

    const questions = await Promise.all(
      test.questions.map((qId) => ctx.db.get(qId))
    );

    return {
      ...attempt,
      test,
      questions: questions.filter(Boolean),
    };
  },
});

export const start = mutation({
  args: {
    testId: v.id("tests"),
    userId: v.id("users"),
    forceNew: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check for existing in-progress attempt
    const attempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_test", (q) =>
        q.eq("userId", args.userId).eq("testId", args.testId)
      )
      .collect();

    const inProgress = attempts.find(a => a.status === "in_progress");

    // If there's an in-progress attempt and not forcing new, return it
    if (inProgress && !args.forceNew) {
      return inProgress._id;
    }

    // If forcing new and there's an in-progress attempt, submit it first
    if (inProgress && args.forceNew) {
      await ctx.db.patch(inProgress._id, {
        status: "submitted",
        submittedAt: Date.now(),
      });
    }

    const test = await ctx.db.get(args.testId);
    if (!test) throw new Error("Test not found");

    // Create new attempt (allows retaking completed tests)
    return await ctx.db.insert("attempts", {
      testId: args.testId,
      userId: args.userId,
      answers: [],
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
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.status !== "in_progress") {
      throw new Error("Cannot modify a submitted test");
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
    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.status !== "in_progress") {
      throw new Error("Test already submitted");
    }

    const test = await ctx.db.get(attempt.testId);
    if (!test) throw new Error("Test not found");

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
    return await ctx.db
      .query("attempts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .collect();
  },
});
