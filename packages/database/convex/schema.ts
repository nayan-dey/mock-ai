import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // AI Chat conversations
  chatConversations: defineTable({
    userId: v.id("users"),
    title: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_updated_at", ["updatedAt"]),

  // AI Chat messages
  chatMessages: defineTable({
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
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_created_at", ["createdAt"]),


  // Batch system for organizing students
  batches: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_active", ["isActive"]),

  // User settings for preferences and privacy
  userSettings: defineTable({
    userId: v.id("users"),
    preferredChartType: v.union(v.literal("heatmap"), v.literal("chart")),
    showHeatmap: v.boolean(),
    showStats: v.boolean(),
    showOnLeaderboard: v.boolean(),
    updatedAt: v.number(),
  }).index("by_user_id", ["userId"]),

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    bio: v.optional(v.string()),
    age: v.optional(v.number()),
    role: v.union(v.literal("student"), v.literal("teacher"), v.literal("admin")),
    batchId: v.optional(v.id("batches")),
    isSuspended: v.optional(v.boolean()),
    suspendedAt: v.optional(v.number()),
    suspendedBy: v.optional(v.id("users")),
    suspendReason: v.optional(v.string()),
    batchLocked: v.optional(v.boolean()), // Set to true when admin assigns batch during unsuspension
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_batch", ["batchId"])
    .index("by_suspended", ["isSuspended"]),

  batchSwitchHistory: defineTable({
    userId: v.id("users"),
    fromBatchId: v.optional(v.id("batches")),
    toBatchId: v.id("batches"),
    switchedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_switched_at", ["switchedAt"]),

  questions: defineTable({
    text: v.string(),
    options: v.array(v.string()),
    correctOptions: v.array(v.number()),
    explanation: v.optional(v.string()),
    subject: v.string(),
    topic: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_subject", ["subject"])
    .index("by_topic", ["topic"])
    .index("by_difficulty", ["difficulty"])
    .index("by_subject_topic", ["subject", "topic"]),

  tests: defineTable({
    title: v.string(),
    description: v.string(),
    questions: v.array(v.id("questions")),
    duration: v.number(),
    totalMarks: v.number(),
    negativeMarking: v.number(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    scheduledAt: v.optional(v.number()),
    batchIds: v.optional(v.array(v.id("batches"))), // empty = all batches
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_created_by", ["createdBy"]),

  attempts: defineTable({
    testId: v.id("tests"),
    userId: v.id("users"),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        selected: v.array(v.number()),
      })
    ),
    score: v.number(),
    totalQuestions: v.number(),
    correct: v.number(),
    incorrect: v.number(),
    unanswered: v.number(),
    startedAt: v.number(),
    submittedAt: v.optional(v.number()),
    status: v.union(
      v.literal("in_progress"),
      v.literal("submitted"),
      v.literal("expired")
    ),
  })
    .index("by_test_id", ["testId"])
    .index("by_user_id", ["userId"])
    .index("by_user_test", ["userId", "testId"])
    .index("by_status", ["status"]),

  notes: defineTable({
    title: v.string(),
    description: v.string(),
    subject: v.string(),
    topic: v.string(),
    fileUrl: v.string(),
    batchIds: v.optional(v.array(v.id("batches"))), // empty = all batches
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_subject", ["subject"])
    .index("by_topic", ["topic"])
    .index("by_subject_topic", ["subject", "topic"]),

  classes: defineTable({
    title: v.string(),
    description: v.string(),
    subject: v.string(),
    topic: v.string(),
    videoUrl: v.string(),
    duration: v.number(),
    thumbnail: v.optional(v.string()),
    batchIds: v.optional(v.array(v.id("batches"))), // empty = all batches
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_subject", ["subject"])
    .index("by_topic", ["topic"])
    .index("by_subject_topic", ["subject", "topic"]),
});
