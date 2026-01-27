import { NextRequest, NextResponse } from "next/server";
import { extractQuestionsFromFile, extractQuestionsFromText } from "@/lib/gemini";
import { parseDocument } from "@/lib/document-parser";
import type { ExtractionResult } from "@repo/types";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const DOCUMENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];

export async function POST(request: NextRequest): Promise<NextResponse<ExtractionResult>> {
  try {
    // Check if API key is configured
    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          questions: [],
          totalExtracted: 0,
          needsReviewCount: 0,
          error: "MISTRAL_API_KEY is not configured. Please add it to your environment variables.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { fileBase64, mimeType, fileName, model } = body;

    // Validate required fields
    if (!fileBase64 || !mimeType) {
      return NextResponse.json(
        {
          success: false,
          questions: [],
          totalExtracted: 0,
          needsReviewCount: 0,
          error: "Missing required fields: fileBase64 and mimeType",
        },
        { status: 400 }
      );
    }

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          questions: [],
          totalExtracted: 0,
          needsReviewCount: 0,
          error: `Invalid file type: ${mimeType}. Supported types: Images (PNG, JPEG, WebP, GIF), PDF, Excel, CSV`,
        },
        { status: 400 }
      );
    }

    // Validate file size (base64 is ~33% larger than binary)
    const estimatedSize = (fileBase64.length * 3) / 4;
    if (estimatedSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          questions: [],
          totalExtracted: 0,
          needsReviewCount: 0,
          error: `File too large. Maximum size is 20MB. Your file is approximately ${Math.round(estimatedSize / (1024 * 1024))}MB`,
        },
        { status: 400 }
      );
    }

    console.log(`Processing file: ${fileName || "unknown"}, type: ${mimeType}, model: ${model || "default"}`);

    let result;

    // Check if it's a document (PDF, Excel, CSV) or an image
    if (DOCUMENT_TYPES.includes(mimeType)) {
      // Parse document to text first
      const parseResult = await parseDocument(fileBase64, mimeType);

      if (parseResult.error) {
        return NextResponse.json(
          {
            success: false,
            questions: [],
            totalExtracted: 0,
            needsReviewCount: 0,
            error: parseResult.error,
          },
          { status: 500 }
        );
      }

      // Extract questions from text using text model
      result = await extractQuestionsFromText(parseResult.text, model);
    } else {
      // Extract questions from image using vision model
      result = await extractQuestionsFromFile(fileBase64, mimeType, model);
    }

    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          questions: [],
          totalExtracted: 0,
          needsReviewCount: 0,
          error: result.error,
        },
        { status: 500 }
      );
    }

    const needsReviewCount = result.questions.filter((q) => q.needsReview).length;

    return NextResponse.json({
      success: true,
      questions: result.questions,
      totalExtracted: result.questions.length,
      needsReviewCount,
    });
  } catch (error) {
    console.error("Error in extract-questions API:", error);
    return NextResponse.json(
      {
        success: false,
        questions: [],
        totalExtracted: 0,
        needsReviewCount: 0,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
