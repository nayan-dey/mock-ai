export interface ExportColumn {
  header: string;
  key: string;
  format?: (value: any, row: any) => string;
}

export interface PdfBrandingOptions {
  orgName?: string;
  orgLogoUrl?: string | null;
}

function prepareRows(
  data: Record<string, any>[],
  columns: ExportColumn[]
): string[][] {
  return data.map((row) =>
    columns.map((col) =>
      col.format
        ? col.format(row[col.key], row)
        : String(row[col.key] ?? "")
    )
  );
}

function generateFilename(prefix: string): string {
  const date = new Date().toISOString().split("T")[0];
  return `${prefix}_${date}`;
}

// ─── Image Helpers ──────────────────────────────────────────────────────────

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Render the actual Nindo SVG logo (from /logo.svg) to a PNG data URL via canvas
const NINDO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2980B9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.99 6.74 1.93 3.44"/><path d="M19.136 12a10 10 0 0 1-14.271 0"/><path d="m21 21-2.16-3.84"/><path d="m3 21 8.02-14.26"/><circle cx="12" cy="5" r="2"/></svg>`;

async function getNindoLogoDataUrl(): Promise<string | null> {
  try {
    const blob = new Blob([NINDO_SVG], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
    });

    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, 64, 64);
    URL.revokeObjectURL(url);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

// ─── Page Header & Footer ───────────────────────────────────────────────────

const HEADER_HEIGHT = 22;

async function addPageHeadersAndFooters(
  doc: any,
  branding: PdfBrandingOptions
) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Pre-load logos
  let orgLogoData: string | null = null;
  if (branding.orgLogoUrl) {
    orgLogoData = await loadImageAsDataUrl(branding.orgLogoUrl);
  }
  const nindoLogoData = await getNindoLogoDataUrl();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // ── Header ──────────────────────────────────────────────────

    // Light header background
    doc.setFillColor(248, 249, 250);
    doc.rect(0, 0, pageWidth, HEADER_HEIGHT, "F");

    // Bottom border line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(0, HEADER_HEIGHT, pageWidth, HEADER_HEIGHT);

    // Left side: Org logo + name
    const logoSize = 10;
    const logoY = (HEADER_HEIGHT - logoSize) / 2;
    let textX = 14;

    if (orgLogoData) {
      try {
        doc.addImage(orgLogoData, "JPEG", 14, logoY, logoSize, logoSize);
        textX = 14 + logoSize + 3;
      } catch {
        // If image fails, just use text
        textX = 14;
      }
    } else if (branding.orgName) {
      // Draw a letter avatar
      doc.setFillColor(41, 128, 185);
      doc.roundedRect(14, logoY, logoSize, logoSize, 2, 2, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(
        branding.orgName.charAt(0).toUpperCase(),
        14 + logoSize / 2,
        logoY + logoSize / 2 + 2.5,
        { align: "center" }
      );
      textX = 14 + logoSize + 3;
    }

    if (branding.orgName) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(branding.orgName, textX, HEADER_HEIGHT / 2 + 3.5);
    }

    // Right side: Nindo AI icon + text
    const nindoIconSize = 10;
    const nindoIconY = (HEADER_HEIGHT - nindoIconSize) / 2;

    // Measure text first to position everything from the right edge
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const nindoLabel = "Nindo AI";
    const nindoLabelWidth = doc.getTextWidth(nindoLabel);

    const nindoTextX = pageWidth - 14 - nindoLabelWidth;
    const nindoIconX = nindoTextX - nindoIconSize - 3;

    // Nindo logo (rendered from SVG)
    if (nindoLogoData) {
      try {
        doc.addImage(nindoLogoData, "PNG", nindoIconX, nindoIconY, nindoIconSize, nindoIconSize);
      } catch {
        // Fallback: blue circle with "N"
        doc.setFillColor(41, 128, 185);
        doc.circle(nindoIconX + nindoIconSize / 2, nindoIconY + nindoIconSize / 2, nindoIconSize / 2, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("N", nindoIconX + nindoIconSize / 2, nindoIconY + nindoIconSize / 2 + 2.5, { align: "center" });
      }
    } else {
      // Fallback: blue circle with "N"
      doc.setFillColor(41, 128, 185);
      doc.circle(nindoIconX + nindoIconSize / 2, nindoIconY + nindoIconSize / 2, nindoIconSize / 2, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("N", nindoIconX + nindoIconSize / 2, nindoIconY + nindoIconSize / 2 + 2.5, { align: "center" });
    }

    // "Nindo AI" label
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 128, 185);
    doc.text(nindoLabel, nindoTextX, HEADER_HEIGHT / 2 + 3.5);

    // ── Footer ──────────────────────────────────────────────────

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);

    // Left: nindo.biz
    doc.text("nindo.biz", 14, pageHeight - 8);

    // Center: page number
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, {
      align: "center",
    });

    // Right: date
    doc.text(
      new Date().toLocaleDateString(),
      pageWidth - 14,
      pageHeight - 8,
      { align: "right" }
    );
  }

  // Reset
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
}

// ─── Excel Export ────────────────────────────────────────────────────────────

export async function exportToExcel(
  data: Record<string, any>[],
  columns: ExportColumn[],
  filenamePrefix: string,
  sheetName = "Sheet1"
): Promise<void> {
  const XLSX = await import("xlsx");
  const headers = columns.map((c) => c.header);
  const rows = prepareRows(data, columns);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Auto-size columns
  ws["!cols"] = headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map((r) => (r[i] ?? "").length)
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${generateFilename(filenamePrefix)}.xlsx`);
}

export async function exportMultiSheetExcel(
  sheets: {
    name: string;
    data: Record<string, any>[];
    columns: ExportColumn[];
  }[],
  filenamePrefix: string
): Promise<void> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const headers = sheet.columns.map((c) => c.header);
    const rows = prepareRows(sheet.data, sheet.columns);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    ws["!cols"] = headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...rows.map((r) => (r[i] ?? "").length)
      );
      return { wch: Math.min(maxLen + 2, 40) };
    });

    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }

  XLSX.writeFile(wb, `${generateFilename(filenamePrefix)}.xlsx`);
}

// ─── PDF Export ──────────────────────────────────────────────────────────────

const TABLE_START_Y = HEADER_HEIGHT + 8;

export async function exportToPdf(
  data: Record<string, any>[],
  columns: ExportColumn[],
  filenamePrefix: string,
  title?: string,
  orgName?: string,
  orgLogoUrl?: string | null
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });

  let startY = TABLE_START_Y;

  if (title) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, startY);
    startY += 8;
  }

  autoTable(doc, {
    startY,
    head: [columns.map((c) => c.header)],
    body: prepareRows(data, columns),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: TABLE_START_Y },
  });

  await addPageHeadersAndFooters(doc, { orgName, orgLogoUrl });
  doc.save(`${generateFilename(filenamePrefix)}.pdf`);
}

export async function exportMultiSectionPdf(
  sections: {
    title: string;
    data: Record<string, any>[];
    columns: ExportColumn[];
  }[],
  filenamePrefix: string,
  documentTitle?: string,
  orgName?: string,
  orgLogoUrl?: string | null
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });
  let startY = TABLE_START_Y;

  if (documentTitle) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(documentTitle, 14, startY);
    startY += 10;
  }

  sections.forEach((section, idx) => {
    if (idx > 0) {
      const currentY = (doc as any).lastAutoTable?.finalY ?? startY;
      if (currentY > 160) {
        doc.addPage();
        startY = TABLE_START_Y;
      } else {
        startY = currentY + 12;
      }
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, 14, startY);
    startY += 6;

    autoTable(doc, {
      startY,
      head: [section.columns.map((c) => c.header)],
      body: prepareRows(section.data, section.columns),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: TABLE_START_Y },
    });

    startY = (doc as any).lastAutoTable?.finalY ?? startY;
  });

  await addPageHeadersAndFooters(doc, { orgName, orgLogoUrl });
  doc.save(`${generateFilename(filenamePrefix)}.pdf`);
}
