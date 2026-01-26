import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSettings")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const upsert = mutation({
  args: {
    userId: v.id("users"),
    preferredChartType: v.optional(v.union(v.literal("heatmap"), v.literal("chart"))),
    showHeatmap: v.optional(v.boolean()),
    showStats: v.optional(v.boolean()),
    showOnLeaderboard: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    const updates = {
      preferredChartType: args.preferredChartType,
      showHeatmap: args.showHeatmap,
      showStats: args.showStats,
      showOnLeaderboard: args.showOnLeaderboard,
    };

    // Filter out undefined values
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

    // Create new settings with defaults
    return await ctx.db.insert("userSettings", {
      userId: args.userId,
      preferredChartType: args.preferredChartType ?? "chart",
      showHeatmap: args.showHeatmap ?? true,
      showStats: args.showStats ?? true,
      showOnLeaderboard: args.showOnLeaderboard ?? true,
      updatedAt: Date.now(),
    });
  },
});

export const getOrCreateDefault = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (settings) {
      return settings;
    }

    // Return default settings (without persisting)
    return {
      _id: null,
      userId: args.userId,
      preferredChartType: "chart" as const,
      showHeatmap: true,
      showStats: true,
      showOnLeaderboard: true,
      updatedAt: Date.now(),
    };
  },
});
