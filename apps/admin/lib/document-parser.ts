import * as XLSX from "xlsx";

export interface ParseResult {
  text: string;
  error?: string;
}

export async function parseDocument(
  fileBase64: string,
  mimeType: string
): Promise<ParseResult> {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(fileBase64, "base64");

    if (mimeType === "application/pdf") {
      return await parsePDFWithOCR(fileBase64);
    }

    if (
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "application/vnd.ms-excel"
    ) {
      return parseExcel(buffer);
    }

    if (mimeType === "text/csv") {
      return parseCSV(buffer);
    }

    return {
      text: "",
      error: `Unsupported document type: ${mimeType}`,
    };
  } catch (error) {
    console.error("Document parsing error:", error);
    return {
      text: "",
      error: error instanceof Error ? error.message : "Failed to parse document",
    };
  }
}

async function parsePDFWithOCR(fileBase64: string): Promise<ParseResult> {
  const apiKey = process.env.OCR_SPACE_API_KEY;

  if (!apiKey) {
    return {
      text: "",
      error: "OCR_SPACE_API_KEY is not configured. Please add it to your environment variables.",
    };
  }

  try {
    const formData = new FormData();
    formData.append("base64Image", `data:application/pdf;base64,${fileBase64}`);
    formData.append("apikey", apiKey);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("filetype", "PDF");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    formData.append("OCREngine", "2"); // Engine 2 is better for documents

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      return {
        text: "",
        error: `OCR API error: ${response.status} ${response.statusText}`,
      };
    }

    const result = await response.json();

    if (result.IsErroredOnProcessing) {
      return {
        text: "",
        error: result.ErrorMessage?.[0] || "OCR processing failed",
      };
    }

    // Combine text from all pages
    const allText = result.ParsedResults
      ?.map((page: { ParsedText?: string }) => page.ParsedText || "")
      .join("\n\n--- Page Break ---\n\n")
      .trim();

    if (!allText) {
      return {
        text: "",
        error: "No text could be extracted from the PDF. The file may be empty or unreadable.",
      };
    }

    return { text: allText };
  } catch (error) {
    console.error("OCR API error:", error);
    return {
      text: "",
      error: error instanceof Error ? error.message : "Failed to process PDF with OCR",
    };
  }
}

function parseExcel(buffer: Buffer): ParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const textParts: string[] = [];

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];

      // Convert to JSON for easier processing
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

      if (jsonData.length > 0) {
        textParts.push(`--- Sheet: ${sheetName} ---`);

        for (const row of jsonData) {
          if (row && row.length > 0) {
            const rowText = row
              .map((cell) => (cell !== null && cell !== undefined ? String(cell) : ""))
              .filter((cell) => cell.trim() !== "")
              .join(" | ");

            if (rowText.trim()) {
              textParts.push(rowText);
            }
          }
        }

        textParts.push(""); // Empty line between sheets
      }
    }

    const fullText = textParts.join("\n");

    if (!fullText.trim()) {
      return {
        text: "",
        error: "Excel file appears to be empty.",
      };
    }

    return { text: fullText };
  } catch (error) {
    console.error("Excel parsing error:", error);
    return {
      text: "",
      error: "Failed to parse Excel file. The file may be corrupted.",
    };
  }
}

function parseCSV(buffer: Buffer): ParseResult {
  try {
    const text = buffer.toString("utf-8");

    if (!text.trim()) {
      return {
        text: "",
        error: "CSV file appears to be empty.",
      };
    }

    // Format CSV for better readability
    const lines = text.split("\n");
    const formattedLines = lines.map((line) => {
      // Split by comma, handling quoted values
      const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      return cells
        .map((cell) => cell.replace(/^"|"$/g, "").trim())
        .filter((cell) => cell !== "")
        .join(" | ");
    });

    return { text: formattedLines.join("\n") };
  } catch (error) {
    console.error("CSV parsing error:", error);
    return {
      text: "",
      error: "Failed to parse CSV file.",
    };
  }
}
