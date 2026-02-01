export interface ExportColumn {
  header: string;
  key: string;
  format?: (value: any, row: any) => string;
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

function addPdfBranding(doc: any, orgName?: string) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const brandingText = orgName
    ? `NindoAI | nindo.biz | ${orgName}`
    : "NindoAI | nindo.biz";

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(brandingText, pageWidth / 2, pageHeight - 8, { align: "center" });
  }
  // Reset text color
  doc.setTextColor(0, 0, 0);
}

export async function exportToPdf(
  data: Record<string, any>[],
  columns: ExportColumn[],
  filenamePrefix: string,
  title?: string,
  orgName?: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });

  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 20);
  }

  autoTable(doc, {
    startY: title ? 30 : 14,
    head: [columns.map((c) => c.header)],
    body: prepareRows(data, columns),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  addPdfBranding(doc, orgName);
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
  orgName?: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });
  let startY = 14;

  if (documentTitle) {
    doc.setFontSize(18);
    doc.text(documentTitle, 14, 20);
    startY = 30;
  }

  sections.forEach((section, idx) => {
    if (idx > 0) {
      // Check if we need a new page (leave room for section header)
      const currentY = (doc as any).lastAutoTable?.finalY ?? startY;
      if (currentY > 170) {
        doc.addPage();
        startY = 14;
      } else {
        startY = currentY + 12;
      }
    }

    doc.setFontSize(13);
    doc.text(section.title, 14, startY);
    startY += 6;

    autoTable(doc, {
      startY,
      head: [section.columns.map((c) => c.header)],
      body: prepareRows(section.data, section.columns),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    startY = (doc as any).lastAutoTable?.finalY ?? startY;
  });

  addPdfBranding(doc, orgName);
  doc.save(`${generateFilename(filenamePrefix)}.pdf`);
}
