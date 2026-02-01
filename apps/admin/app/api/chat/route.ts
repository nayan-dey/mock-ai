import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";
import {
  ADMIN_CHAT_MODEL,
  CHAT_MODEL_CONFIG,
} from "@repo/types";

function buildAdminSystemPrompt(adminContext: {
  orgName: string;
  totalStudents: number;
  totalBatches: number;
  batchSummary: Array<{ name: string; isActive: boolean; studentCount: number }>;
  feeSummary: {
    totalDueCount: number;
    totalDueAmount: number;
    batchBreakdown: Record<string, { dueCount: number; dueAmount: number }>;
    studentsWithDueFees: Array<{ studentName: string; amount: number; dueDate: string }>;
  };
  testSummary: {
    totalTests: number;
    publishedCount: number;
    tests: Array<{
      title: string;
      status: string;
      attemptCount: number;
      avgScore: number;
      totalMarks: number;
    }>;
  };
  topStudents: Array<{ name: string; totalScore: number }>;
  recentActivity: Array<{
    studentName: string;
    testName: string;
    score: number;
    totalMarks: number;
    submittedAt: string;
  }>;
}) {
  return `You are Nindo AI, an admin assistant for the Nindo platform. You help administrators understand their organization's data, track student performance, manage fees, and make data-driven decisions.

## Organization Context
- Organization: ${adminContext.orgName}
- Total Students: ${adminContext.totalStudents}
- Total Batches: ${adminContext.totalBatches}

## Batches
${adminContext.batchSummary.map((b) => `- ${b.name}: ${b.studentCount} students (${b.isActive ? "Active" : "Inactive"})`).join("\n")}

## Fee Summary
- Total Due: ${adminContext.feeSummary.totalDueCount} fees pending (₹${adminContext.feeSummary.totalDueAmount.toLocaleString("en-IN")})
- By Batch:
${Object.entries(adminContext.feeSummary.batchBreakdown).map(([batch, data]) => `  - ${batch}: ${data.dueCount} due (₹${data.dueAmount.toLocaleString("en-IN")})`).join("\n")}

## Students with Due Fees
${adminContext.feeSummary.studentsWithDueFees.length > 0 ? adminContext.feeSummary.studentsWithDueFees.map((s) => `- ${s.studentName}: ₹${s.amount.toLocaleString("en-IN")} (due ${s.dueDate})`).join("\n") : "- No pending fees"}

## Test Summary
- Total Tests: ${adminContext.testSummary.totalTests} (${adminContext.testSummary.publishedCount} published)
${adminContext.testSummary.tests.map((t) => `- ${t.title} [${t.status}]: ${t.attemptCount} attempts, avg ${t.avgScore}/${t.totalMarks}`).join("\n")}

## Top 5 Students (by Total Score)
${adminContext.topStudents.length > 0 ? adminContext.topStudents.map((s, i) => `${i + 1}. ${s.name}: ${s.totalScore} points`).join("\n") : "- No student data yet"}

## Recent Activity
${adminContext.recentActivity.length > 0 ? adminContext.recentActivity.map((a) => `- ${a.studentName} scored ${a.score}/${a.totalMarks} on "${a.testName}" (${a.submittedAt})`).join("\n") : "- No recent activity"}

## Admin Pages
- /dashboard - Admin dashboard overview
- /users - Student management
- /batches - Batch management
- /fees - Fee tracking and management
- /questions - Question bank
- /questions/extract - AI question extraction
- /tests - Test management
- /analytics - Detailed analytics
- /notes - Study materials
- /classes - Video lectures

## Your Role
1. Answer questions about fee status, who has pending fees, batch-wise breakdowns
2. Provide student performance insights, test analytics, and batch comparisons
3. Identify top performers and students needing attention
4. Help with data lookups from the context provided
5. Respond concisely; use tables or lists when presenting data
6. When referencing admin pages, include links like (/fees), (/users), (/tests)

## STRICT RULES
1. ONLY answer questions related to:
   - Organization data: fees, students, batches, tests, performance
   - Data analysis and comparisons from the provided context
   - Navigation help for admin pages

2. REFUSE to answer questions about:
   - General knowledge, news, weather, or unrelated topics
   - Technical implementation details or API information
   - Individual student private data beyond what's in the context
   - Anything not related to the Nindo admin platform

3. If asked about restricted topics, politely redirect:
   "I'm here to help you manage your Nindo organization. I can tell you about fees, student performance, test analytics, and more. What would you like to know?"

4. Keep responses concise (2-3 paragraphs max) unless detailed analysis is requested.
5. Use ₹ (Indian Rupees) for all currency values.`;
}

export async function POST(req: Request) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google API key is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Admin context is sent from the client (fetched via Convex React hook)
    const { messages, adminContext } = await req.json();

    if (!adminContext) {
      return new Response(
        JSON.stringify({ error: "Admin context not available. Please wait for data to load." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = buildAdminSystemPrompt(adminContext);

    const result = await streamText({
      model: google(ADMIN_CHAT_MODEL),
      system: systemPrompt,
      messages,
      maxTokens: CHAT_MODEL_CONFIG.maxTokens,
      temperature: CHAT_MODEL_CONFIG.temperature,
      topP: CHAT_MODEL_CONFIG.topP,
      topK: CHAT_MODEL_CONFIG.topK,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Admin chat API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
