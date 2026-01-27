import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const switchBatch = mutation({
  args: {
    userId: v.id("users"),
    newBatchId: v.id("batches"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isSuspended) {
      throw new Error("Your account is suspended and cannot switch batches");
    }

    const newBatch = await ctx.db.get(args.newBatchId);
    if (!newBatch || !newBatch.isActive) {
      throw new Error("Invalid or inactive batch");
    }

    const currentBatchId = user.batchId;

    // Don't log if switching to the same batch
    if (currentBatchId === args.newBatchId) {
      return { success: true, message: "Already in this batch" };
    }

    // Log the batch switch
    await ctx.db.insert("batchSwitchHistory", {
      userId: args.userId,
      fromBatchId: currentBatchId,
      toBatchId: args.newBatchId,
      switchedAt: Date.now(),
    });

    // Update user's batch
    await ctx.db.patch(args.userId, { batchId: args.newBatchId });

    return { success: true, message: "Batch switched successfully" };
  },
});

export const getSwitchHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("batchSwitchHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Fetch batch details for each entry
    const enrichedHistory = await Promise.all(
      history.map(async (entry) => {
        const [fromBatch, toBatch] = await Promise.all([
          entry.fromBatchId ? ctx.db.get(entry.fromBatchId) : null,
          ctx.db.get(entry.toBatchId),
        ]);

        return {
          ...entry,
          fromBatchName: fromBatch?.name || "No Batch",
          toBatchName: toBatch?.name || "Unknown",
        };
      })
    );

    return enrichedHistory;
  },
});

export const getAllSwitchHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    const history = await ctx.db
      .query("batchSwitchHistory")
      .withIndex("by_switched_at")
      .order("desc")
      .take(limit);

    // Fetch user and batch details
    const enrichedHistory = await Promise.all(
      history.map(async (entry) => {
        const [user, fromBatch, toBatch] = await Promise.all([
          ctx.db.get(entry.userId),
          entry.fromBatchId ? ctx.db.get(entry.fromBatchId) : null,
          ctx.db.get(entry.toBatchId),
        ]);

        return {
          ...entry,
          userName: user?.name || "Unknown",
          userEmail: user?.email || "Unknown",
          fromBatchName: fromBatch?.name || "No Batch",
          toBatchName: toBatch?.name || "Unknown",
        };
      })
    );

    return enrichedHistory;
  },
});

export const getUsersWithMultipleSwitches = query({
  args: {
    minSwitches: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const minSwitches = args.minSwitches || 2;

    const allHistory = await ctx.db
      .query("batchSwitchHistory")
      .collect();

    // Count switches per user
    const switchCounts: Record<string, number> = {};
    for (const entry of allHistory) {
      const id = entry.userId as string;
      switchCounts[id] = (switchCounts[id] || 0) + 1;
    }

    // Filter users with multiple switches
    const suspiciousUserIds = Object.entries(switchCounts)
      .filter(([_, count]) => count >= minSwitches)
      .map(([userId]) => userId);

    // Get user details
    const users = await Promise.all(
      suspiciousUserIds.map(async (userId) => {
        const user = await ctx.db.get(userId as Id<"users">);
        const batch = user?.batchId ? await ctx.db.get(user.batchId) : null;

        return {
          userId,
          name: user?.name || "Unknown",
          email: user?.email || "Unknown",
          role: user?.role || "student",
          batchName: batch?.name || "No Batch",
          switchCount: switchCounts[userId],
          isSuspended: user?.isSuspended || false,
        };
      })
    );

    // Filter out admin users (they can't be suspended)
    return users
      .filter((u) => u.role !== "admin")
      .sort((a, b) => b.switchCount - a.switchCount);
  },
});

export const getUserSwitchCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("batchSwitchHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return history.length;
  },
});
