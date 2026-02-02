import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import {
  SUBJECTS,
  type ExtractedQuestion,
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
5. Difficulty level (easy, medium, or hard) based on complexity
6. An explanation of why the answer is correct (if not provided in the document, generate a brief one)

IMPORTANT RULES:
- Extract EVERY question you can find
- If a question has multiple correct answers, include all of them
- If you're uncertain about the correct answer, still provide your best guess but mark it for review
- If the document quality is poor or text is unclear, still attempt extraction and flag for review
- CRITICAL: Do NOT use LaTeX notation in the output. Write all math expressions as plain readable text using Unicode symbols.
  - Do NOT wrap anything in dollar signs ($...$) or use LaTeX commands like \\tan, \\frac, \\circ, \\sqrt, etc.
  - Use Unicode math symbols instead: × (multiply), ÷ (divide), ° (degree), √ (square root), π (pi), ≤, ≥, ≠, ±
  - Write trig functions as plain text: tan, sin, cos, log (not \\tan, \\sin, \\cos, \\log)
  - Write fractions as a/b (not \\frac{a}{b})
  - Write exponents as x^2 or x² (not $x^{2}$)
  - Examples: Write "tan 45° = 1" NOT "$\\tan 45^\\circ = 1$", Write "2x + 5 = 13" NOT "$2x + 5 = 13$"
- Preserve Bengali/Bangla text exactly as written using Unicode characters
- IMPORTANT: Do NOT include question numbers in the question text. Remove any numbering prefixes like "1.", "2>", "3)", "Q1.", "Question 1.", "No.1", "#1", "i.", "ii)", "III.", "a.", "A)", "প্রশ্ন ১." or roman numerals etc. The question text should start directly with the actual question content, not a number or label.

Available subjects: ${SUBJECTS.join(", ")}

Respond ONLY with a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "questions": [
    {
      "text": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptions": [0],
      "explanation": "Explanation of the correct answer",
      "subject": "Mathematics",
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
5. Difficulty level (easy, medium, or hard) based on complexity
6. An explanation of why the answer is correct (if not provided in the document, generate a brief one)

IMPORTANT RULES:
- Extract EVERY question you can find
- If a question has multiple correct answers, include all of them
- If you're uncertain about the correct answer, still provide your best guess but mark it for review
- CRITICAL: Do NOT use LaTeX notation in the output. Write all math expressions as plain readable text using Unicode symbols.
  - Do NOT wrap anything in dollar signs ($...$) or use LaTeX commands like \\tan, \\frac, \\circ, \\sqrt, etc.
  - Use Unicode math symbols instead: × (multiply), ÷ (divide), ° (degree), √ (square root), π (pi), ≤, ≥, ≠, ±
  - Write trig functions as plain text: tan, sin, cos, log (not \\tan, \\sin, \\cos, \\log)
  - Write fractions as a/b (not \\frac{a}{b})
  - Write exponents as x^2 or x² (not $x^{2}$)
  - Examples: Write "tan 45° = 1" NOT "$\\tan 45^\\circ = 1$", Write "2x + 5 = 13" NOT "$2x + 5 = 13$"
- Preserve Bengali/Bangla text exactly as written using Unicode characters
- IMPORTANT: Do NOT include question numbers in the question text. Remove any numbering prefixes like "1.", "2>", "3)", "Q1.", "Question 1.", "No.1", "#1", "i.", "ii)", "III.", "a.", "A)", "প্রশ্ন ১." or roman numerals etc. The question text should start directly with the actual question content, not a number or label.

Available subjects: ${SUBJECTS.join(", ")}

Respond ONLY with a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "questions": [
    {
      "text": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptions": [0],
      "explanation": "Explanation of the correct answer",
      "subject": "Mathematics",
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

    const result = await generateText({
      model: google(selectedModel),
      prompt: EXTRACTION_PROMPT_TEXT + text,
      temperature: EXTRACTION_MODEL_CONFIG.temperature,
      topP: EXTRACTION_MODEL_CONFIG.topP,
      topK: EXTRACTION_MODEL_CONFIG.topK,
      abortSignal: controller.signal,
    });

    clearTimeout(timeoutId);

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

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
      abortSignal: controller.signal,
    });

    clearTimeout(timeoutId);

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

  // Handle timeout/abort errors
  if (error instanceof DOMException && error.name === "AbortError" || errorMessage.includes("aborted")) {
    return {
      questions: [],
      error: "AI processing timed out. The image may be too complex. Please try a clearer image or a smaller file.",
    };
  }

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

function cleanLatexArtifacts(text: string): string {
  let cleaned = text;

  // Remove $$ ... $$ (display math) and $ ... $ (inline math) delimiters
  cleaned = cleaned.replace(/\$\$(.*?)\$\$/g, "$1");
  cleaned = cleaned.replace(/\$(.*?)\$/g, "$1");

  // Replace \frac{a}{b} with a/b
  cleaned = cleaned.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1/$2");

  // Replace \sqrt{x} with √x and \sqrt[n]{x} with ⁿ√x
  cleaned = cleaned.replace(/\\sqrt\[([^\]]*)\]\{([^}]*)\}/g, "$1√$2");
  cleaned = cleaned.replace(/\\sqrt\{([^}]*)\}/g, "√$1");

  // Replace \text{...} with content inside
  cleaned = cleaned.replace(/\\text\{([^}]*)\}/g, "$1");

  // Replace trig/log functions (remove backslash)
  cleaned = cleaned.replace(/\\(sin|cos|tan|cot|sec|csc|log|ln|lim|max|min)\b/g, "$1");

  // Replace common LaTeX symbols with Unicode
  const symbolMap: [RegExp, string][] = [
    [/\\times/g, "×"],
    [/\\div/g, "÷"],
    [/\\circ/g, "°"],
    [/\\degree/g, "°"],
    [/\\pi/g, "π"],
    [/\\theta/g, "θ"],
    [/\\alpha/g, "α"],
    [/\\beta/g, "β"],
    [/\\gamma/g, "γ"],
    [/\\delta/g, "δ"],
    [/\\lambda/g, "λ"],
    [/\\mu/g, "μ"],
    [/\\sigma/g, "σ"],
    [/\\omega/g, "ω"],
    [/\\infty/g, "∞"],
    [/\\leq/g, "≤"],
    [/\\geq/g, "≥"],
    [/\\neq/g, "≠"],
    [/\\pm/g, "±"],
    [/\\mp/g, "∓"],
    [/\\approx/g, "≈"],
    [/\\rightarrow/g, "→"],
    [/\\leftarrow/g, "←"],
    [/\\Rightarrow/g, "⇒"],
    [/\\Leftarrow/g, "⇐"],
    [/\\subset/g, "⊂"],
    [/\\supset/g, "⊃"],
    [/\\cup/g, "∪"],
    [/\\cap/g, "∩"],
    [/\\in /g, "∈ "],
    [/\\notin/g, "∉"],
    [/\\forall/g, "∀"],
    [/\\exists/g, "∃"],
    [/\\sum/g, "Σ"],
    [/\\prod/g, "Π"],
    [/\\int/g, "∫"],
    [/\\partial/g, "∂"],
    [/\\nabla/g, "∇"],
    [/\\cdot/g, "·"],
    [/\\ldots/g, "…"],
    [/\\dots/g, "…"],
  ];
  for (const [pattern, replacement] of symbolMap) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // Remove \left and \right (sizing commands)
  cleaned = cleaned.replace(/\\left/g, "");
  cleaned = cleaned.replace(/\\right/g, "");

  // Remove redundant ^ before degree symbol (from ^\circ -> ^°)
  cleaned = cleaned.replace(/\^°/g, "°");

  // Replace ^{...} with plain text (superscript content)
  cleaned = cleaned.replace(/\^\{([^}]*)\}/g, "^$1");
  // Replace _{...} with plain text (subscript content)
  cleaned = cleaned.replace(/_\{([^}]*)\}/g, "_$1");

  // Remove any remaining backslash commands (e.g., \quad, \space, \;, \,)
  cleaned = cleaned.replace(/\\[a-zA-Z]+/g, " ");
  cleaned = cleaned.replace(/\\[;,!: ]/g, " ");

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

function stripQuestionNumbering(text: string): string {
  let cleaned = text;

  // "Question 1.", "Ques. 2)", "Ques 3:" etc.
  cleaned = cleaned.replace(/^(?:Question|Ques\.?)\s*\d+[\.\)\:\-\>]?\s*/i, "");

  // "Q1.", "Q2:", "Q 3)", "q1." etc.
  cleaned = cleaned.replace(/^Q\s*\d+[\.\)\:\-\>]?\s*/i, "");

  // Bengali question prefix: "প্রশ্ন ১.", "প্র ২)" etc.
  cleaned = cleaned.replace(/^(?:প্রশ্ন|প্র)\s*[০-৯\d]+[\.\)\>\-\:]?\s*/, "");

  // "No.1", "No. 2", "no.3" etc.
  cleaned = cleaned.replace(/^No\.?\s*\d+[\.\)\:\-\>]?\s*/i, "");

  // "#1", "#2" etc.
  cleaned = cleaned.replace(/^#\s*\d+[\.\)\:\-\>]?\s*/, "");

  // "(1)", "(২)", "(iv)" etc. (parenthesized numbers or roman numerals)
  cleaned = cleaned.replace(/^\([০-৯\d]+\)\s*/, "");
  cleaned = cleaned.replace(/^\([ivxlcdmIVXLCDM]+\)\s*/, "");

  // Roman numerals: "i.", "ii)", "III.", "IV>", "ix:" etc.
  cleaned = cleaned.replace(/^(?:x{0,3})(ix|iv|v?i{0,3})[\.\)\>\-\:]\s*/i, "");

  // "1.", "2)", "3>", "4-", "5:" etc. (digit followed by punctuation)
  cleaned = cleaned.replace(/^\d+[\.\)\>\-\:]\s*/, "");

  // Bengali numerals: "১.", "২)", "৩>" etc.
  cleaned = cleaned.replace(/^[০-৯]+[\.\)\>\-\:]\s*/, "");

  // Devanagari numerals: "१.", "२)" etc. (sometimes appear in regional docs)
  cleaned = cleaned.replace(/^[०-९]+[\.\)\>\-\:]\s*/, "");

  // Single letter prefix: "a.", "A)", "b." etc. (only single letter to avoid stripping words)
  cleaned = cleaned.replace(/^[a-zA-Z][\.\)]\s*/, "");

  return cleaned;
}

function validateAndCleanQuestion(q: Record<string, unknown>): ExtractedQuestion | null {
  // Basic validation
  if (!q.text || typeof q.text !== "string" || q.text.trim() === "") {
    return null;
  }

  if (!Array.isArray(q.options) || q.options.length < 2) {
    return null;
  }

  const options = q.options
    .filter((o: unknown) => typeof o === "string" && o.trim() !== "")
    .map((o: string) => cleanLatexArtifacts(o));
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
    text: stripQuestionNumbering(cleanLatexArtifacts(q.text.trim())),
    options,
    correctOptions,
    explanation: typeof q.explanation === "string" ? cleanLatexArtifacts(q.explanation) : undefined,
    subject,
    difficulty,
    confidence,
    needsReview,
    reviewReason,
  };
}
