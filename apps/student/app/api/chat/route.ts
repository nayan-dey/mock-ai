import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@repo/database";
import {
  STUDENT_CHAT_MODEL,
  CHAT_MODEL_CONFIG
} from "@repo/types";

function buildSystemPrompt(studentContext: {
  profile: { name: string; bio?: string | null; batchName: string | null; joinedAt: number };
  analytics: {
    totalTestsTaken: number;
    totalScore: number;
    avgAccuracy: number;
    totalCorrect: number;
    totalIncorrect: number;
    totalUnanswered: number;
  };
  leaderboard: { rank: number; totalStudents: number; percentile: number };
  subjectPerformance: Array<{ subject: string; correct: number; total: number; accuracy: number }>;
  recentAttempts: Array<{
    testTitle: string;
    testId: string;
    score: number;
    totalMarks: number;
    correct: number;
    incorrect: number;
    unanswered: number;
    submittedAt?: number;
  }>;
  availableTests: Array<{ id: string; title: string; duration: number; totalMarks: number }>;
  attemptedTestIds: string[];
}) {
  const weakSubjects = studentContext.subjectPerformance
    .filter((s) => s.accuracy < 60)
    .slice(0, 3);

  const strongSubjects = studentContext.subjectPerformance
    .filter((s) => s.accuracy >= 70)
    .slice(-3)
    .reverse();

  return `You are Nindo AI, a helpful study assistant for the Nindo exam preparation app. You help students understand their performance, provide study recommendations, and guide them through the app.

## Student Context
- Name: ${studentContext.profile.name}
- Batch: ${studentContext.profile.batchName || "No batch assigned"}
- Tests Taken: ${studentContext.analytics.totalTestsTaken}
- Total Score: ${studentContext.analytics.totalScore}
- Average Accuracy: ${studentContext.analytics.avgAccuracy.toFixed(1)}%
- Leaderboard Rank: ${studentContext.leaderboard.rank} out of ${studentContext.leaderboard.totalStudents} (Top ${studentContext.leaderboard.percentile}%)

## Subject Performance (Weakest to Strongest)
${studentContext.subjectPerformance.map((s) => `- ${s.subject}: ${s.accuracy.toFixed(1)}% (${s.correct}/${s.total} correct)`).join("\n")}

## Weak Subjects (Need Focus)
${weakSubjects.length > 0 ? weakSubjects.map((s) => `- ${s.subject}: ${s.accuracy.toFixed(1)}%`).join("\n") : "- No weak subjects identified yet"}

## Strong Subjects
${strongSubjects.length > 0 ? strongSubjects.map((s) => `- ${s.subject}: ${s.accuracy.toFixed(1)}%`).join("\n") : "- Keep taking tests to identify strengths"}

## Recent Tests
${studentContext.recentAttempts.length > 0 ? studentContext.recentAttempts.map((a) => `- ${a.testTitle}: ${a.score}/${a.totalMarks} (${a.correct} correct, ${a.incorrect} wrong, ${a.unanswered} skipped)`).join("\n") : "- No tests taken yet"}

## Available Tests
${studentContext.availableTests.length > 0 ? studentContext.availableTests.map((t) => `- ${t.title} (${t.duration} mins, ${t.totalMarks} marks)`).join("\n") : "- No new tests available"}

## App Pages
- /dashboard - Overview of performance with charts
- /tests - List of available tests to take
- /results - All past test results and analytics
- /leaderboard - Rankings and comparisons
- /notes - Study materials and notes
- /classes - Video lectures and classes
- /me - Your profile page
- /settings - Privacy and preferences

## Your Role
1. Answer questions about the student's performance, scores, and rankings
2. Provide personalized study recommendations based on weak subjects
3. Help navigate the app and explain features
4. Motivate and encourage the student
5. Be concise and helpful

## STRICT RULES - NEVER VIOLATE THESE
1. ONLY answer questions related to:
   - Student's own test performance, scores, and analytics
   - Subject-wise analysis and improvement tips
   - Leaderboard position and rankings (only public info)
   - Study recommendations based on performance data
   - App navigation and feature explanations
   - Batch and profile information

2. REFUSE to answer questions about:
   - Weather, news, sports, entertainment, or general knowledge
   - Admin panel, teacher credentials, or system access
   - Test questions or answers for tests NOT in attemptedTestIds
   - Other students' private data, emails, or personal info
   - Technical implementation details or API information
   - Anything not related to Nindo app or studying

3. If asked about restricted topics, politely redirect:
   "I'm here to help you with your Nindo performance and studies. I can tell you about your scores, suggest subjects to focus on, or help you navigate the app. What would you like to know?"

4. For test questions: Only discuss questions from tests the student has already attempted. Never reveal answers for upcoming tests.

5. Keep responses concise (2-3 paragraphs max) unless detailed analysis is requested.

## Response Format
When suggesting app pages, include them naturally in your response like:
"You can check your detailed results on the Results page (/results)"

Be encouraging and supportive while being factually accurate about performance data.`;
}

export async function POST(req: Request) {
  try {
    // Check for API key
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Google API key is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Authenticate user
    const { userId: clerkId, getToken } = await auth();
    if (!clerkId) {
      console.error("No clerkId found - user not authenticated");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get messages and client-provided context from request body
    const { messages, studentContext: clientContext } = await req.json();

    // Try server-side fetch first, fall back to client-provided context
    let studentContext = clientContext;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (convexUrl) {
      try {
        const convex = new ConvexHttpClient(convexUrl);
        const convexToken = await getToken({ template: "convex" });
        if (convexToken) {
          convex.setAuth(convexToken);
        }
        studentContext = await convex.query(api.chat.getStudentContext, {});
      } catch (ctxError) {
        console.error("Failed to fetch student context server-side, using client context:", ctxError);
        // Fall through to use clientContext
      }
    }

    if (!studentContext) {
      return new Response(
        JSON.stringify({ error: "Failed to load student context" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build system prompt with server-fetched student context
    const systemPrompt = buildSystemPrompt(studentContext);

    // Stream response using Vercel AI SDK with Google Gemini
    const result = await streamText({
      model: google(STUDENT_CHAT_MODEL),
      system: systemPrompt,
      messages,
      maxTokens: CHAT_MODEL_CONFIG.maxTokens,
      temperature: CHAT_MODEL_CONFIG.temperature,
      topP: CHAT_MODEL_CONFIG.topP,
      topK: CHAT_MODEL_CONFIG.topK,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
