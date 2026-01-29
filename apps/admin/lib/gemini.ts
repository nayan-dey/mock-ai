import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import {
  SUBJECTS,
  TOPICS,
  type ExtractedQuestion,
  type Subject,
  ADMIN_EXTRACTION_MODEL,
  EXTRACTION_MODEL_CONFIG,
} from "@repo/types";

const EXTRACTION_PROMPT_IMAGE = `You are an expert at extracting multiple-choice questions from educational documents.

Analyze the provided image and extract ALL multiple-choice questions you can find.

For each question, provide:
1. The question text (exactly as written, preserving any formatting)
2. All answer options (labeled A, B, C, D, etc.)
3. The correct answer(s) - identify which option(s) are correct based on:
   - Explicit marking in the document (checkmarks, circles, highlighting)
   - Answer keys if visible
   - If no answer is marked, make your best educated guess based on the subject matter
4. Subject classification (must be one of: ${SUBJECTS.join(", ")})
5. Topic classification based on the subject
6. Difficulty level (easy, medium, or hard) based on complexity
7. An explanation of why the answer is correct (if not provided in the document, generate a brief one)

IMPORTANT RULES:
- Extract EVERY question you can find
- If a question has multiple correct answers, include all of them
- If you're uncertain about the correct answer, still provide your best guess but mark it for review
- Preserve mathematical notation, formulas, and special characters
- If the document quality is poor or text is unclear, still attempt extraction and flag for review

Available subjects and their topics:
${SUBJECTS.map((s) => `${s}: ${TOPICS[s as Subject].join(", ")}`).join("\n")}

Respond ONLY with a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "questions": [
    {
      "text": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptions": [0],
      "explanation": "Explanation of the correct answer",
      "subject": "Mathematics",
      "topic": "Algebra",
      "difficulty": "medium",
      "confidence": 0.95,
      "needsReview": false,
      "reviewReason": null
    }
  ]
}

Notes:
- correctOptions is a 0-indexed array (0 = first option, 1 = second option, etc.)
- confidence should be 0.0 to 1.0 indicating how confident you are in the extraction
- Set needsReview to true if: unclear text, uncertain answer, poor image quality, or missing information
- reviewReason should explain why review is needed (or null if not needed)`;

const EXTRACTION_PROMPT_TEXT = `You are an expert at extracting multiple-choice questions from educational documents.

Analyze the following text extracted from a document and extract ALL multiple-choice questions you can find.

For each question, provide:
1. The question text (exactly as written, preserving any formatting)
2. All answer options (labeled A, B, C, D, etc.)
3. The correct answer(s) - identify which option(s) are correct based on:
   - Explicit marking in the document (checkmarks, circles, highlighting)
   - Answer keys if visible
   - If no answer is marked, make your best educated guess based on the subject matter
4. Subject classification (must be one of: ${SUBJECTS.join(", ")})
5. Topic classification based on the subject
6. Difficulty level (easy, medium, or hard) based on complexity
7. An explanation of why the answer is correct (if not provided in the document, generate a brief one)

IMPORTANT RULES:
- Extract EVERY question you can find
- If a question has multiple correct answers, include all of them
- If you're uncertain about the correct answer, still provide your best guess but mark it for review
- Preserve mathematical notation, formulas, and special characters

Available subjects and their topics:
${SUBJECTS.map((s) => `${s}: ${TOPICS[s as Subject].join(", ")}`).join("\n")}

Respond ONLY with a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "questions": [
    {
      "text": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptions": [0],
      "explanation": "Explanation of the correct answer",
      "subject": "Mathematics",
      "topic": "Algebra",
      "difficulty": "medium",
      "confidence": 0.95,
      "needsReview": false,
      "reviewReason": null
    }
  ]
}

Notes:
- correctOptions is a 0-indexed array (0 = first option, 1 = second option, etc.)
- confidence should be 0.0 to 1.0 indicating how confident you are in the extraction
- Set needsReview to true if: unclear text, uncertain answer, or missing information
- reviewReason should explain why review is needed (or null if not needed)

--- DOCUMENT TEXT ---
`;

export interface GeminiExtractionResult {
  questions: ExtractedQuestion[];
  error?: string;
}

export async function extractQuestionsFromText(
  text: string,
  model?: string
): Promise<GeminiExtractionResult> {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return {
        questions: [],
        error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured",
      };
    }

    const selectedModel = model || ADMIN_EXTRACTION_MODEL;

    const result = await generateText({
      model: google(selectedModel),
      prompt: EXTRACTION_PROMPT_TEXT + text,
      temperature: EXTRACTION_MODEL_CONFIG.temperature,
      topP: EXTRACTION_MODEL_CONFIG.topP,
      topK: EXTRACTION_MODEL_CONFIG.topK,
    });

    return parseAIResponse(result.text);
  } catch (error) {
    console.error("Gemini API error:", error);
    return handleGeminiError(error);
  }
}

export async function extractQuestionsFromFile(
  fileBase64: string,
  mimeType: string,
  model?: string
): Promise<GeminiExtractionResult> {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return {
        questions: [],
        error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured",
      };
    }

    const selectedModel = model || ADMIN_EXTRACTION_MODEL;

    const result = await generateText({
      model: google(selectedModel),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: `data:${mimeType};base64,${fileBase64}`,
            },
            {
              type: "text",
              text: EXTRACTION_PROMPT_IMAGE,
            },
          ],
        },
      ],
      temperature: EXTRACTION_MODEL_CONFIG.temperature,
      topP: EXTRACTION_MODEL_CONFIG.topP,
      topK: EXTRACTION_MODEL_CONFIG.topK,
    });

    return parseAIResponse(result.text);
  } catch (error) {
    console.error("Gemini API error:", error);
    return handleGeminiError(error);
  }
}

function parseAIResponse(content: string): GeminiExtractionResult {
  try {
    // Try to extract JSON from the response (handle potential markdown code blocks)
    let jsonStr = content.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return {
        questions: [],
        error: "Invalid response format from AI",
      };
    }

    // Validate and clean up each question
    const validatedQuestions: ExtractedQuestion[] = parsed.questions
      .map((q: Record<string, unknown>) => validateAndCleanQuestion(q))
      .filter((q: ExtractedQuestion | null): q is ExtractedQuestion => q !== null);

    return { questions: validatedQuestions };
  } catch {
    console.error("Failed to parse response:", content);
    return {
      questions: [],
      error: "Failed to parse AI response as JSON",
    };
  }
}

function handleGeminiError(error: unknown): GeminiExtractionResult {
  const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

  // Handle rate limit errors
  if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
    return {
      questions: [],
      error: "Rate limit exceeded. Please wait a moment and try again.",
    };
  }

  // Handle authentication errors
  if (errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("invalid_api_key") || errorMessage.includes("API_KEY_INVALID")) {
    return {
      questions: [],
      error: "Invalid API key. Please check your GOOGLE_GENERATIVE_AI_API_KEY in the environment variables.",
    };
  }

  // Handle safety filter errors (Gemini-specific)
  if (errorMessage.includes("SAFETY") || errorMessage.includes("blocked")) {
    return {
      questions: [],
      error: "Content was blocked by safety filters. Please try a different image or document.",
    };
  }

  return {
    questions: [],
    error: errorMessage,
  };
}

function validateAndCleanQuestion(q: Record<string, unknown>): ExtractedQuestion | null {
  // Basic validation
  if (!q.text || typeof q.text !== "string" || q.text.trim() === "") {
    return null;
  }

  if (!Array.isArray(q.options) || q.options.length < 2) {
    return null;
  }

  const options = q.options.filter(
    (o: unknown) => typeof o === "string" && o.trim() !== ""
  );
  if (options.length < 2) {
    return null;
  }

  // Validate correctOptions
  let correctOptions: number[] = [];
  if (Array.isArray(q.correctOptions)) {
    correctOptions = q.correctOptions.filter(
      (idx: unknown) =>
        typeof idx === "number" && idx >= 0 && idx < options.length
    );
  }

  // If no valid correct options, mark for review
  const needsReviewForAnswer = correctOptions.length === 0;
  if (needsReviewForAnswer) {
    correctOptions = [0]; // Default to first option but flag for review
  }

  // Validate subject
  let subject = String(q.subject || "");
  if (!SUBJECTS.includes(subject as (typeof SUBJECTS)[number])) {
    subject = "Mathematics"; // Default subject
  }

  // Validate topic
  const validTopics = TOPICS[subject as Subject];
  let topic = String(q.topic || "");
  if (!validTopics.includes(topic)) {
    topic = validTopics[0]; // Default to first topic
  }

  // Validate difficulty
  let difficulty: "easy" | "medium" | "hard" = "medium";
  if (q.difficulty === "easy" || q.difficulty === "medium" || q.difficulty === "hard") {
    difficulty = q.difficulty;
  }

  // Validate confidence
  let confidence = 0.5;
  if (typeof q.confidence === "number" && q.confidence >= 0 && q.confidence <= 1) {
    confidence = q.confidence;
  }

  const needsReview =
    needsReviewForAnswer ||
    q.needsReview === true ||
    confidence < 0.7;

  let reviewReason: string | undefined;
  if (needsReviewForAnswer) {
    reviewReason = "Could not determine correct answer";
  } else if (typeof q.reviewReason === "string" && q.reviewReason) {
    reviewReason = q.reviewReason;
  } else if (confidence < 0.7) {
    reviewReason = "Low confidence in extraction accuracy";
  }

  return {
    text: q.text.trim(),
    options,
    correctOptions,
    explanation: typeof q.explanation === "string" ? q.explanation : undefined,
    subject,
    topic,
    difficulty,
    confidence,
    needsReview,
    reviewReason,
  };
}
