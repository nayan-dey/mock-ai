import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Organizations for admin onboarding
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    contactEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    adminClerkId: v.string(),
    createdAt: v.number(),
  })
    .index("by_admin_clerk_id", ["adminClerkId"])
    .index("by_slug", ["slug"]),

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
    referralCode: v.string(),
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_referral_code", ["referralCode"])
    .index("by_organization", ["organizationId"]),

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
    profileImageId: v.optional(v.id("_storage")),
    role: v.union(v.literal("student"), v.literal("teacher"), v.literal("admin")),
    batchId: v.optional(v.id("batches")),
    isSuspended: v.optional(v.boolean()),
    suspendedAt: v.optional(v.number()),
    suspendedBy: v.optional(v.id("users")),
    suspendReason: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_batch", ["batchId"])
    .index("by_suspended", ["isSuspended"])
    .index("by_organization", ["organizationId"]),

  questions: defineTable({
    text: v.string(),
    options: v.array(v.string()),
    correctOptions: v.array(v.number()),
    explanation: v.optional(v.string()),
    subject: v.string(),
    topic: v.optional(v.string()),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_subject", ["subject"])
    .index("by_difficulty", ["difficulty"])
    .index("by_organization", ["organizationId"]),

  tests: defineTable({
    title: v.string(),
    description: v.string(),
    questions: v.array(v.id("questions")),
    duration: v.number(),
    totalMarks: v.number(),
    negativeMarking: v.number(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    answerKeyPublished: v.optional(v.boolean()),
    scheduledAt: v.optional(v.number()),
    batchIds: v.optional(v.array(v.id("batches"))), // empty = all batches
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_created_by", ["createdBy"])
    .index("by_organization", ["organizationId"]),

  attempts: defineTable({
    testId: v.id("tests"),
    userId: v.id("users"),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        selected: v.array(v.number()),
      })
    ),
    questionOrder: v.optional(v.array(v.id("questions"))),
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
    topic: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    batchIds: v.optional(v.array(v.id("batches"))), // empty = all batches
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_subject", ["subject"])
    .index("by_organization", ["organizationId"]),

  classes: defineTable({
    title: v.string(),
    description: v.string(),
    subject: v.string(),
    topic: v.optional(v.string()),
    videoUrl: v.string(),
    duration: v.optional(v.number()),
    thumbnail: v.optional(v.string()),
    batchIds: v.optional(v.array(v.id("batches"))), // empty = all batches
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_subject", ["subject"])
    .index("by_organization", ["organizationId"]),

  // Multi-admin support: maps admin clerkIds to organizations
  orgAdmins: defineTable({
    clerkId: v.string(),
    organizationId: v.id("organizations"),
    isSuperAdmin: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_organization", ["organizationId"]),

  // Join requests for admins wanting to join an existing org
  orgJoinRequests: defineTable({
    organizationId: v.id("organizations"),
    clerkId: v.string(),
    userName: v.string(),
    userEmail: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_org_status", ["organizationId", "status"]),

  // Admin notifications
  notifications: defineTable({
    organizationId: v.id("organizations"),
    type: v.union(
      v.literal("fee_overdue"),
      v.literal("fee_paid"),
      v.literal("test_submitted"),
      v.literal("join_request"),
      v.literal("student_enrolled"),
      v.literal("student_suspended"),
      v.literal("student_unsuspended")
    ),
    title: v.string(),
    message: v.string(),
    referenceId: v.optional(v.string()),
    referenceType: v.optional(
      v.union(
        v.literal("fee"),
        v.literal("attempt"),
        v.literal("joinRequest"),
        v.literal("user"),
        v.literal("batch")
      )
    ),
    actorId: v.optional(v.id("users")),
    actorName: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_org_read", ["organizationId", "isRead"])
    .index("by_org_created", ["organizationId", "createdAt"])
    .index("by_org_type", ["organizationId", "type"]),

  // Fee records for students
  fees: defineTable({
    studentId: v.id("users"),
    amount: v.number(),
    status: v.union(v.literal("paid"), v.literal("due")),
    dueDate: v.number(),
    paidDate: v.optional(v.number()),
    description: v.optional(v.string()),
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"])
    .index("by_student_status", ["studentId", "status"])
    .index("by_organization", ["organizationId"]),
});
