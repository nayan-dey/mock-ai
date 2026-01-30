import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";

export const getByUserId = query({
  args: {},
  handler: async (ctx) => {
    // Derive userId from auth — users can only see their own settings
    const user = await requireAuth(ctx);

    return await ctx.db
      .query("userSettings")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .first();
  },
});

export const upsert = mutation({
  args: {
    preferredChartType: v.optional(v.union(v.literal("heatmap"), v.literal("chart"))),
    showHeatmap: v.optional(v.boolean()),
    showStats: v.optional(v.boolean()),
    showOnLeaderboard: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Derive userId from auth — users can only update their own settings
    const user = await requireAuth(ctx);

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .first();

    const updates = {
      preferredChartType: args.preferredChartType,
      showHeatmap: args.showHeatmap,
      showStats: args.showStats,
      showOnLeaderboard: args.showOnLeaderboard,
    };

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...filteredUpdates,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("userSettings", {
      userId: user._id,
      preferredChartType: args.preferredChartType ?? "chart",
      showHeatmap: args.showHeatmap ?? true,
      showStats: args.showStats ?? true,
      showOnLeaderboard: args.showOnLeaderboard ?? true,
      updatedAt: Date.now(),
    });
  },
});

export const getOrCreateDefault = query({
  args: {},
  handler: async (ctx) => {
    // Derive userId from auth
    const user = await requireAuth(ctx);

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .first();

    if (settings) {
      return settings;
    }

    return {
      _id: null,
      userId: user._id,
      preferredChartType: "chart" as const,
      showHeatmap: true,
      showStats: true,
      showOnLeaderboard: true,
      updatedAt: Date.now(),
    };
  },
});
