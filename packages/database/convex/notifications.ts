import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireAdmin, getOrgId } from "./lib/auth";

const notificationType = v.union(
  v.literal("fee_overdue"),
  v.literal("fee_paid"),
  v.literal("test_submitted"),
  v.literal("join_request"),
  v.literal("student_enrolled"),
  v.literal("student_suspended"),
  v.literal("student_unsuspended")
);

const referenceType = v.union(
  v.literal("fee"),
  v.literal("attempt"),
  v.literal("joinRequest"),
  v.literal("user"),
  v.literal("batch")
);

// Internal mutation used by other mutations via ctx.scheduler.runAfter(0, ...)
export const createNotification = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    type: notificationType,
    title: v.string(),
    message: v.string(),
    referenceId: v.optional(v.string()),
    referenceType: v.optional(referenceType),
    actorId: v.optional(v.id("users")),
    actorName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// Get latest notifications for the admin's org
export const getAll = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);
    const limit = args.limit ?? 50;

    return await ctx.db
      .query("notifications")
      .withIndex("by_org_created", (q) => q.eq("organizationId", orgId))
      .order("desc")
      .take(limit);
  },
});

// Get count of unread notifications
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_org_read", (q) =>
        q.eq("organizationId", orgId).eq("isRead", false)
      )
      .collect();

    return unread.length;
  },
});

// Mark a single notification as read
export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const notification = await ctx.db.get(args.id);
    if (!notification || notification.organizationId !== orgId) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.id, { isRead: true });
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const orgId = getOrgId(admin);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_org_read", (q) =>
        q.eq("organizationId", orgId).eq("isRead", false)
      )
      .collect();

    await Promise.all(
      unread.map((n) => ctx.db.patch(n._id, { isRead: true }))
    );
  },
});

// Daily cron: create notifications for overdue fees (deduped per fee per day)
export const checkOverdueFees = internalMutation({
  args: {},
  handler: async (ctx) => {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - THIRTY_DAYS_MS;

    const allDueFees = await ctx.db
      .query("fees")
      .withIndex("by_status", (q) => q.eq("status", "due"))
      .collect();

    const overdue = allDueFees.filter((fee) => fee.dueDate <= cutoff);

    for (const fee of overdue) {
      // Deduplicate: skip if we already created a fee_overdue notification for this fee today
      const existing = await ctx.db
        .query("notifications")
        .withIndex("by_org_type", (q) =>
          q.eq("organizationId", fee.organizationId).eq("type", "fee_overdue")
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("referenceId"), fee._id),
            q.gte(q.field("createdAt"), Date.now() - ONE_DAY_MS)
          )
        )
        .first();

      if (!existing) {
        const student = await ctx.db.get(fee.studentId);
        const daysOverdue = Math.floor(
          (Date.now() - fee.dueDate) / (1000 * 60 * 60 * 24)
        );

        await ctx.db.insert("notifications", {
          organizationId: fee.organizationId,
          type: "fee_overdue",
          title: "Fee Overdue",
          message: `${student?.name ?? "A student"}'s fee of ₹${fee.amount} is ${daysOverdue} days overdue`,
          referenceId: fee._id,
          referenceType: "fee",
          actorId: fee.studentId,
          actorName: student?.name,
          isRead: false,
          createdAt: Date.now(),
        });
      }
    }
  },
});

// Weekly cron: delete read notifications older than 90 days
export const cleanupOldNotifications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - NINETY_DAYS_MS;

    const old = await ctx.db
      .query("notifications")
      .filter((q) =>
        q.and(
          q.eq(q.field("isRead"), true),
          q.lt(q.field("createdAt"), cutoff)
        )
      )
      .take(500);

    await Promise.all(old.map((n) => ctx.db.delete(n._id)));
  },
});
