import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAuth, requireAdmin, getOrgId } from "./lib/auth";

// Filter to keep only the first submitted attempt per user per test.
// "First" = earliest startedAt.
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

// Tier calculation helper
function calculateTier(testsCompleted: number, avgAccuracy: number, isTopTen: boolean) {
  if (testsCompleted >= 100 && avgAccuracy > 85 && isTopTen) {
    return { tier: 6, name: "Legend", icon: "Flame" };
  }
  if (testsCompleted >= 51 && avgAccuracy > 80) {
    return { tier: 5, name: "Subject Master", icon: "Crown" };
  }
  if (testsCompleted >= 31 && avgAccuracy > 70) {
    return { tier: 4, name: "Test Champion", icon: "Trophy" };
  }
  if (testsCompleted >= 16 && avgAccuracy > 60) {
    return { tier: 3, name: "Consistent Performer", icon: "TrendingUp" };
  }
  if (testsCompleted >= 6 && avgAccuracy > 50) {
    return { tier: 2, name: "Quick Learner", icon: "Zap" };
  }
  if (testsCompleted >= 1) {
    return { tier: 1, name: "Rising Star", icon: "Star" };
  }
  return { tier: 0, name: "Newcomer", icon: "User" };
}

export const getStudentAnalytics = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await requireAuth(ctx);

    // Admin can see any student; students can only see their own
    if (caller.role !== "admin" && caller._id !== args.userId) {
      throw new Error("You can only view your own analytics");
    }

    const allAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    // Fetch tests and filter out attempts where answer key is not published
    const allTests = await Promise.all(
      allAttempts.map((attempt) => ctx.db.get(attempt.testId))
    );
    const publishedAttempts = allAttempts.filter((_, i) => allTests[i]?.answerKeyPublished === true);

    // Only count first attempt per test
    const attempts = keepFirstAttempts(publishedAttempts);

    // Build a test lookup map for the filtered attempts
    const testMap = new Map<string, NonNullable<(typeof allTests)[number]>>();
    for (let i = 0; i < allAttempts.length; i++) {
      const t = allTests[i];
      if (t) testMap.set(allAttempts[i].testId as string, t);
    }
    const tests = attempts.map((a) => testMap.get(a.testId as string) ?? null);

    if (attempts.length === 0) {
      return {
        totalTestsTaken: 0,
        averageScore: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        subjectWisePerformance: {},
        recentAttempts: [],
      };
    }

    const totalCorrect = attempts.reduce((sum, a) => sum + a.correct, 0);
    const totalIncorrect = attempts.reduce((sum, a) => sum + a.incorrect, 0);
    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);

    const subjectWisePerformance: Record<string, { correct: number; total: number }> = {};

    const allQuestionIds = new Set<Id<"questions">>();
    for (const test of tests) {
      if (test) {
        for (const questionId of test.questions) {
          allQuestionIds.add(questionId);
        }
      }
    }

    const questionsArray = await Promise.all(
      Array.from(allQuestionIds).map((id) => ctx.db.get(id))
    );
    const questionsMap = new Map(
      questionsArray.filter((q): q is NonNullable<typeof q> => q !== null)
        .map((q) => [q._id as string, q])
    );

    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      const test = tests[i];
      if (!test) continue;

      for (const questionId of test.questions) {
        const question = questionsMap.get(questionId as string);
        if (!question) continue;

        const subject = question.subject;
        if (!subjectWisePerformance[subject]) {
          subjectWisePerformance[subject] = { correct: 0, total: 0 };
        }

        subjectWisePerformance[subject].total++;

        const answer = attempt.answers.find((a) => a.questionId === questionId);
        if (answer) {
          const isCorrect =
            answer.selected.length === question.correctOptions.length &&
            answer.selected.every((s) => question.correctOptions.includes(s)) &&
            question.correctOptions.every((c) => answer.selected.includes(c));
          if (isCorrect) {
            subjectWisePerformance[subject].correct++;
          }
        }
      }
    }

    const recentAttempts = attempts
      .slice(0, 5)
      .map((attempt, i) => ({
        ...attempt,
        testTitle: tests[attempts.indexOf(attempt)]?.title || "Unknown Test",
      }));

    return {
      totalTestsTaken: attempts.length,
      averageScore: totalScore / attempts.length,
      totalCorrect,
      totalIncorrect,
      subjectWisePerformance,
      recentAttempts,
    };
  },
});

export const getTestAnalytics = query({
  args: { testId: v.id("tests") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const test = await ctx.db.get(args.testId);
    if (!test || test.organizationId !== orgId) {
      throw new Error("Access denied");
    }

    const allTestAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_test_id", (q) => q.eq("testId", args.testId))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    // Only count first attempt per user for this test
    const attempts = keepFirstAttempts(allTestAttempts);

    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        questionWiseAnalysis: [],
        scoreDistribution: [],
      };
    }

    const scores = attempts.map((a) => a.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    const questionWiseAnalysis = [];

    if (test) {
      const questions = await Promise.all(
        test.questions.map((questionId) => ctx.db.get(questionId))
      );

      for (let i = 0; i < test.questions.length; i++) {
        const questionId = test.questions[i];
        const question = questions[i];
        if (!question) continue;

        let correctAttempts = 0;
        for (const attempt of attempts) {
          const answer = attempt.answers.find((a) => a.questionId === questionId);
          if (answer) {
            const isCorrect =
              answer.selected.length === question.correctOptions.length &&
              answer.selected.every((s) => question.correctOptions.includes(s)) &&
              question.correctOptions.every((c) => answer.selected.includes(c));
            if (isCorrect) correctAttempts++;
          }
        }

        questionWiseAnalysis.push({
          questionId,
          questionText: question.text.substring(0, 50) + "...",
          correctAttempts,
          totalAttempts: attempts.length,
          successRate: (correctAttempts / attempts.length) * 100,
        });
      }
    }

    const scoreDistribution = [
      { range: "0-20%", count: 0 },
      { range: "21-40%", count: 0 },
      { range: "41-60%", count: 0 },
      { range: "61-80%", count: 0 },
      { range: "81-100%", count: 0 },
    ];

    for (const attempt of attempts) {
      const percentage = test ? (attempt.score / test.totalMarks) * 100 : 0;
      if (percentage <= 20) scoreDistribution[0].count++;
      else if (percentage <= 40) scoreDistribution[1].count++;
      else if (percentage <= 60) scoreDistribution[2].count++;
      else if (percentage <= 80) scoreDistribution[3].count++;
      else scoreDistribution[4].count++;
    }

    return {
      totalAttempts: attempts.length,
      averageScore,
      highestScore,
      lowestScore,
      questionWiseAnalysis,
      scoreDistribution,
    };
  },
});

export const getLeaderboard = query({
  args: { testId: v.id("tests") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    // Only show leaderboard if answer key is published
    const test = await ctx.db.get(args.testId);
    if (!test || !test.answerKeyPublished) return [];

    const allAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_test_id", (q) => q.eq("testId", args.testId))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    // Only count each student's first attempt for leaderboard
    const attempts = keepFirstAttempts(allAttempts);

    const leaderboard = await Promise.all(
      attempts
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(async (attempt, index) => {
          const user = await ctx.db.get(attempt.userId);
          return {
            rank: index + 1,
            userId: attempt.userId,
            userName: user?.name || "Unknown",
            score: attempt.score,
            correct: attempt.correct,
            timeTaken: attempt.submittedAt
              ? attempt.submittedAt - attempt.startedAt
              : 0,
          };
        })
    );

    return leaderboard;
  },
});

export const getStudentPerformanceTrend = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const caller = await requireAuth(ctx);

    if (caller.role !== "admin" && caller._id !== args.userId) {
      throw new Error("You can only view your own performance trend");
    }

    const limit = args.limit || 10;
    const rawAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .order("desc")
      .collect();

    // Only count first attempt per test
    const allAttempts = keepFirstAttempts(rawAttempts).sort(
      (a, b) => b.startedAt - a.startedAt
    );

    // Filter to only published answer key attempts, then take limit
    const trend: { testTitle: string; score: number; accuracy: number; submittedAt: number | null; date: string }[] = [];
    for (const attempt of allAttempts) {
      if (trend.length >= limit) break;
      const test = await ctx.db.get(attempt.testId);
      if (!test || !test.answerKeyPublished) continue;
      const totalQuestions = attempt.correct + attempt.incorrect + attempt.unanswered;
      const accuracy = totalQuestions > 0
        ? (attempt.correct / totalQuestions) * 100
        : 0;
      trend.push({
        testTitle: test.title || "Unknown Test",
        score: attempt.score,
        accuracy: Math.round(accuracy),
        submittedAt: attempt.submittedAt ?? null,
        date: attempt.submittedAt
          ? new Date(attempt.submittedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "",
      });
    }

    return trend.reverse();
  },
});

export const getAttemptBreakdown = query({
  args: { attemptId: v.id("attempts") },
  handler: async (ctx, args) => {
    const caller = await requireAuth(ctx);

    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) return [];

    if (caller.role !== "admin" && caller._id !== attempt.userId) {
      throw new Error("You can only view your own attempt breakdown");
    }

    const test = await ctx.db.get(attempt.testId);
    if (!test || !test.answerKeyPublished) return [];

    const questions = await Promise.all(
      test.questions.map((questionId) => ctx.db.get(questionId))
    );

    const subjectBreakdown: Record<
      string,
      { correct: number; incorrect: number; unanswered: number; total: number }
    > = {};

    for (let i = 0; i < test.questions.length; i++) {
      const questionId = test.questions[i];
      const question = questions[i];
      if (!question) continue;

      const subject = question.subject;
      if (!subjectBreakdown[subject]) {
        subjectBreakdown[subject] = { correct: 0, incorrect: 0, unanswered: 0, total: 0 };
      }

      subjectBreakdown[subject].total++;

      const answer = attempt.answers.find((a) => a.questionId === questionId);
      if (!answer || answer.selected.length === 0) {
        subjectBreakdown[subject].unanswered++;
      } else {
        const isCorrect =
          answer.selected.length === question.correctOptions.length &&
          answer.selected.every((s) => question.correctOptions.includes(s)) &&
          question.correctOptions.every((c) => answer.selected.includes(c));
        if (isCorrect) {
          subjectBreakdown[subject].correct++;
        } else {
          subjectBreakdown[subject].incorrect++;
        }
      }
    }

    return Object.entries(subjectBreakdown).map(([subject, data]) => ({
      subject,
      ...data,
    }));
  },
});

export const getGlobalLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    if (!user.organizationId) return [];

    const limit = args.limit || 20;

    // Get users in the same org
    const orgUsers = await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId!))
      .collect();
    const orgUserIds = new Set(orgUsers.map((u) => u._id as string));

    const rawAttempts = await ctx.db
      .query("attempts")
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    const orgAttempts = rawAttempts.filter((a) => orgUserIds.has(a.userId as string));

    // Filter to only include attempts for tests with published answer keys
    const testCache = new Map<string, boolean>();
    const publishedAttempts: typeof orgAttempts = [];
    for (const attempt of orgAttempts) {
      const tid = attempt.testId as string;
      if (!testCache.has(tid)) {
        const t = await ctx.db.get(attempt.testId);
        testCache.set(tid, t?.answerKeyPublished === true);
      }
      if (testCache.get(tid)) {
        publishedAttempts.push(attempt);
      }
    }

    // Only count each student's first attempt per test for leaderboard
    const attempts = keepFirstAttempts(publishedAttempts);

    const userStats: Record<
      string,
      {
        userId: Id<"users">;
        totalScore: number;
        testsCompleted: number;
        totalCorrect: number;
        totalQuestions: number;
      }
    > = {};

    for (const attempt of attempts) {
      const id = attempt.userId as string;
      if (!userStats[id]) {
        userStats[id] = {
          userId: attempt.userId,
          totalScore: 0,
          testsCompleted: 0,
          totalCorrect: 0,
          totalQuestions: 0,
        };
      }
      userStats[id].totalScore += attempt.score;
      userStats[id].testsCompleted++;
      userStats[id].totalCorrect += attempt.correct;
      userStats[id].totalQuestions +=
        attempt.correct + attempt.incorrect + attempt.unanswered;
    }

    const sortedAll = Object.values(userStats)
      .sort((a, b) => b.totalScore - a.totalScore);

    const topTenUserIds = new Set(sortedAll.slice(0, 10).map(s => s.userId as string));

    const [allUsers, allSettings] = await Promise.all([
      Promise.all(sortedAll.map((stats) => ctx.db.get(stats.userId))),
      Promise.all(
        sortedAll.map((stats) =>
          ctx.db
            .query("userSettings")
            .withIndex("by_user_id", (q) => q.eq("userId", stats.userId))
            .first()
        )
      ),
    ]);

    const filteredStats = sortedAll.filter((stats, index) => {
      const user = allUsers[index];
      const settings = allSettings[index];
      if (user?.isSuspended) return false;
      return !settings || settings.showOnLeaderboard !== false;
    });

    const sorted = filteredStats.slice(0, limit);

    const leaderboard = await Promise.all(
      sorted.map(async (stats, index) => {
        const user = await ctx.db.get(stats.userId);
        const batch = user?.batchId ? await ctx.db.get(user.batchId) : null;
        const avgAccuracy = stats.totalQuestions > 0
          ? (stats.totalCorrect / stats.totalQuestions) * 100
          : 0;
        const tier = calculateTier(
          stats.testsCompleted,
          avgAccuracy,
          topTenUserIds.has(stats.userId as string)
        );

        return {
          rank: index + 1,
          userId: stats.userId,
          userName: user?.name || "Unknown",
          batchName: batch?.name || null,
          totalScore: stats.totalScore,
          testsCompleted: stats.testsCompleted,
          avgAccuracy,
          tier,
        };
      })
    );

    return leaderboard;
  },
});

export const getBatchLeaderboard = query({
  args: {
    batchId: v.id("batches"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const limit = args.limit || 20;

    const batchUsers = await ctx.db
      .query("users")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .collect();

    const activeUsers = batchUsers.filter((u) => !u.isSuspended);
    const userIds = new Set(activeUsers.map((u) => u._id as string));

    const rawAttempts = await ctx.db
      .query("attempts")
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    const batchRawAttempts = rawAttempts.filter((a) => userIds.has(a.userId as string));

    // Filter to only include attempts for tests with published answer keys
    const testCache = new Map<string, boolean>();
    const publishedBatchAttempts: typeof batchRawAttempts = [];
    for (const attempt of batchRawAttempts) {
      const tid = attempt.testId as string;
      if (!testCache.has(tid)) {
        const t = await ctx.db.get(attempt.testId);
        testCache.set(tid, t?.answerKeyPublished === true);
      }
      if (testCache.get(tid)) {
        publishedBatchAttempts.push(attempt);
      }
    }

    // Only count each student's first attempt per test for leaderboard
    const batchAttempts = keepFirstAttempts(publishedBatchAttempts);

    const userStats: Record<
      string,
      {
        userId: Id<"users">;
        totalScore: number;
        testsCompleted: number;
        totalCorrect: number;
        totalQuestions: number;
      }
    > = {};

    for (const attempt of batchAttempts) {
      const id = attempt.userId as string;
      if (!userStats[id]) {
        userStats[id] = {
          userId: attempt.userId,
          totalScore: 0,
          testsCompleted: 0,
          totalCorrect: 0,
          totalQuestions: 0,
        };
      }
      userStats[id].totalScore += attempt.score;
      userStats[id].testsCompleted++;
      userStats[id].totalCorrect += attempt.correct;
      userStats[id].totalQuestions +=
        attempt.correct + attempt.incorrect + attempt.unanswered;
    }

    const sortedAll = Object.values(userStats)
      .sort((a, b) => b.totalScore - a.totalScore);

    const topTenUserIds = new Set(sortedAll.slice(0, 10).map(s => s.userId as string));

    const allSettings = await Promise.all(
      sortedAll.map((stats) =>
        ctx.db
          .query("userSettings")
          .withIndex("by_user_id", (q) => q.eq("userId", stats.userId))
          .first()
      )
    );

    const filteredStats = sortedAll.filter((stats, index) => {
      const settings = allSettings[index];
      return !settings || settings.showOnLeaderboard !== false;
    });

    const sorted = filteredStats.slice(0, limit);

    const leaderboard = await Promise.all(
      sorted.map(async (stats, index) => {
        const user = await ctx.db.get(stats.userId);
        const avgAccuracy = stats.totalQuestions > 0
          ? (stats.totalCorrect / stats.totalQuestions) * 100
          : 0;
        const tier = calculateTier(
          stats.testsCompleted,
          avgAccuracy,
          topTenUserIds.has(stats.userId as string)
        );

        return {
          rank: index + 1,
          userId: stats.userId,
          userName: user?.name || "Unknown",
          totalScore: stats.totalScore,
          testsCompleted: stats.testsCompleted,
          avgAccuracy,
          tier,
        };
      })
    );

    return leaderboard;
  },
});

export const getUserTestRank = query({
  args: { testId: v.id("tests"), userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    // Only show rank if answer key is published
    const test = await ctx.db.get(args.testId);
    if (!test || !test.answerKeyPublished) {
      return { rank: null, totalParticipants: 0 };
    }

    const allAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_test_id", (q) => q.eq("testId", args.testId))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    // Only count each student's first attempt
    const attempts = keepFirstAttempts(allAttempts);

    const sorted = attempts.sort((a, b) => b.score - a.score);
    const userIndex = sorted.findIndex((a) => a.userId === args.userId);

    return {
      rank: userIndex >= 0 ? userIndex + 1 : null,
      totalParticipants: sorted.length,
    };
  },
});

export const getAdminDashboard = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const [users, tests, questions] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect(),
      ctx.db
        .query("tests")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect(),
      ctx.db
        .query("questions")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect(),
    ]);

    const students = users.filter((u) => u.role === "student");
    const publishedTests = tests.filter((t) => t.status === "published");

    // Get attempts for org's tests only
    const testIds = new Set(tests.map((t) => t._id as string));
    const allAttempts = await ctx.db
      .query("attempts")
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();
    const orgAttempts = allAttempts.filter((a) => testIds.has(a.testId as string));

    // Only count first attempt per user per test
    const attempts = keepFirstAttempts(orgAttempts);

    return {
      totalStudents: students.length,
      totalTests: tests.length,
      publishedTests: publishedTests.length,
      totalQuestions: questions.length,
      totalAttempts: attempts.length,
      averageScore:
        attempts.length > 0
          ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
          : 0,
    };
  },
});

export const getActivityHeatmapData = query({
  args: {
    userId: v.id("users"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const caller = await requireAuth(ctx);

    if (caller.role !== "admin" && caller._id !== args.userId) {
      throw new Error("You can only view your own activity data");
    }

    const rawAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    // Filter to only include attempts for tests with published answer keys
    const testCache = new Map<string, boolean>();
    const publishedAttempts: typeof rawAttempts = [];
    for (const attempt of rawAttempts) {
      const tid = attempt.testId as string;
      if (!testCache.has(tid)) {
        const t = await ctx.db.get(attempt.testId);
        testCache.set(tid, t?.answerKeyPublished === true);
      }
      if (testCache.get(tid)) {
        publishedAttempts.push(attempt);
      }
    }

    // Only count first attempt per test
    const attempts = keepFirstAttempts(publishedAttempts);

    const activityMap: Record<string, { count: number; totalScore: number }> = {};

    for (const attempt of attempts) {
      if (attempt.submittedAt && attempt.submittedAt >= args.startDate && attempt.submittedAt <= args.endDate) {
        const date = new Date(attempt.submittedAt);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        if (!activityMap[dateKey]) {
          activityMap[dateKey] = { count: 0, totalScore: 0 };
        }
        activityMap[dateKey].count++;
        activityMap[dateKey].totalScore += attempt.score;
      }
    }

    return Object.entries(activityMap).map(([date, data]) => ({
      date,
      count: data.count,
      totalScore: data.totalScore,
    }));
  },
});

export const getPublicStudentAnalytics = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await requireAuth(ctx);

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    const showStats = settings?.showStats ?? true;
    const showHeatmap = settings?.showHeatmap ?? true;

    if (!showStats) {
      return { isPrivate: true, showHeatmap };
    }

    const rawAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    // Filter to only published answer key attempts
    const userTestCache = new Map<string, boolean>();
    const publishedUserAttempts: typeof rawAttempts = [];
    for (const attempt of rawAttempts) {
      const tid = attempt.testId as string;
      if (!userTestCache.has(tid)) {
        const t = await ctx.db.get(attempt.testId);
        userTestCache.set(tid, t?.answerKeyPublished === true);
      }
      if (userTestCache.get(tid)) {
        publishedUserAttempts.push(attempt);
      }
    }

    // Only count first attempt per test
    const attempts = keepFirstAttempts(publishedUserAttempts);

    const totalCorrect = attempts.reduce((sum, a) => sum + a.correct, 0);
    const totalQuestions = attempts.reduce(
      (sum, a) => sum + a.correct + a.incorrect + a.unanswered,
      0
    );
    const avgAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Scope rankings by caller's organization
    const orgId = caller.organizationId;
    let orgUserIds: Set<string> | null = null;
    if (orgId) {
      const orgUsers = await ctx.db
        .query("users")
        .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
        .collect();
      orgUserIds = new Set(orgUsers.map((u) => u._id as string));
    }

    const allRawAttempts = await ctx.db
      .query("attempts")
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    // Filter all attempts to only published answer keys for ranking
    const globalTestCache = new Map<string, boolean>();
    const allPublishedAttempts: typeof allRawAttempts = [];
    for (const attempt of allRawAttempts) {
      const tid = attempt.testId as string;
      if (!globalTestCache.has(tid)) {
        const t = await ctx.db.get(attempt.testId);
        globalTestCache.set(tid, t?.answerKeyPublished === true);
      }
      if (globalTestCache.get(tid)) {
        allPublishedAttempts.push(attempt);
      }
    }

    // Only count first attempt per test per user for ranking
    const firstOnlyPublished = keepFirstAttempts(allPublishedAttempts);

    const filteredAttempts = orgUserIds
      ? firstOnlyPublished.filter((a) => orgUserIds!.has(a.userId as string))
      : firstOnlyPublished;

    const userScores: Record<string, number> = {};
    for (const attempt of filteredAttempts) {
      const id = attempt.userId as string;
      userScores[id] = (userScores[id] || 0) + attempt.score;
    }

    const sortedUserIds = Object.entries(userScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    const isTopTen = sortedUserIds.includes(args.userId as string);
    const tier = calculateTier(attempts.length, avgAccuracy, isTopTen);

    const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
    const sortedByScore = Object.entries(userScores).sort(([, a], [, b]) => b - a);
    const rank = sortedByScore.findIndex(([id]) => id === (args.userId as string)) + 1;

    return {
      isPrivate: false,
      showHeatmap,
      totalTestsTaken: attempts.length,
      avgAccuracy: Math.round(avgAccuracy * 10) / 10,
      tier,
      totalScore,
      rank: rank > 0 ? rank : null,
    };
  },
});

export const getStudentAchievements = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const caller = await requireAuth(ctx);

    if (caller.role !== "admin" && caller._id !== args.userId) {
      throw new Error("You can only view your own achievements");
    }

    const rawAttempts = await ctx.db
      .query("attempts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "submitted"))
      .collect();

    const rawTests = await Promise.all(
      rawAttempts.map((attempt) => ctx.db.get(attempt.testId))
    );

    // Filter to only include attempts for tests with published answer keys
    const publishedAttempts = rawAttempts.filter((_, i) => rawTests[i]?.answerKeyPublished === true);

    // Only count first attempt per test
    const attempts = keepFirstAttempts(publishedAttempts);
    const attemptTestMap = new Map<string, NonNullable<(typeof rawTests)[number]>>();
    for (let i = 0; i < rawAttempts.length; i++) {
      const t = rawTests[i];
      if (t) attemptTestMap.set(rawAttempts[i].testId as string, t);
    }
    const tests = attempts.map((a) => attemptTestMap.get(a.testId as string) ?? null);

    const achievements: { id: string; name: string; icon: string; earnedAt: number }[] = [];

    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      const test = tests[i];
      if (!test) continue;

      const totalQuestions = attempt.correct + attempt.incorrect + attempt.unanswered;
      if (attempt.correct === totalQuestions && totalQuestions > 0) {
        const existing = achievements.find((a) => a.id === "perfectionist");
        if (!existing) {
          achievements.push({
            id: "perfectionist",
            name: "Perfectionist",
            icon: "Award",
            earnedAt: attempt.submittedAt || attempt.startedAt,
          });
        }
      }

      if (attempt.submittedAt) {
        const timeUsed = attempt.submittedAt - attempt.startedAt;
        const maxTime = test.duration * 60 * 1000;
        if (timeUsed < maxTime * 0.5) {
          const existing = achievements.find((a) => a.id === "speed-demon");
          if (!existing) {
            achievements.push({
              id: "speed-demon",
              name: "Speed Demon",
              icon: "Rocket",
              earnedAt: attempt.submittedAt,
            });
          }
        }
      }
    }

    const testAttempts: Record<string, number[]> = {};
    for (const attempt of attempts) {
      const testId = attempt.testId as string;
      const totalQuestions = attempt.correct + attempt.incorrect + attempt.unanswered;
      const accuracy = totalQuestions > 0 ? (attempt.correct / totalQuestions) * 100 : 0;

      if (!testAttempts[testId]) {
        testAttempts[testId] = [];
      }
      testAttempts[testId].push(accuracy);
    }

    for (const accuracies of Object.values(testAttempts)) {
      if (accuracies.length >= 2) {
        const firstAttempt = accuracies[0];
        const lastAttempt = accuracies[accuracies.length - 1];
        if (lastAttempt - firstAttempt >= 30) {
          const existing = achievements.find((a) => a.id === "comeback-king");
          if (!existing) {
            achievements.push({
              id: "comeback-king",
              name: "Comeback King",
              icon: "RefreshCcw",
              earnedAt: Date.now(),
            });
          }
          break;
        }
      }
    }

    const sortedByDate = attempts
      .filter((a) => a.submittedAt)
      .sort((a, b) => (a.submittedAt || 0) - (b.submittedAt || 0));

    if (sortedByDate.length >= 7) {
      const uniqueDays = new Set<string>();
      for (const attempt of sortedByDate) {
        if (attempt.submittedAt) {
          const date = new Date(attempt.submittedAt);
          uniqueDays.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
        }
      }

      const daysList = Array.from(uniqueDays).sort();
      let maxStreak = 1;
      let currentStreak = 1;

      for (let i = 1; i < daysList.length; i++) {
        const prev = new Date(daysList[i - 1]);
        const curr = new Date(daysList[i]);
        const diffDays = Math.round(
          (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }

      if (maxStreak >= 7) {
        achievements.push({
          id: "streak-master",
          name: "Streak Master",
          icon: "Flame",
          earnedAt: Date.now(),
        });
      }
    }

    return achievements;
  },
});
