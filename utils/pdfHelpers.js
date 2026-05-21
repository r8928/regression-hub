const DARK = [15, 23, 42];
const TEAL = [13, 148, 136];

/**
 * Draws the standard dark-navy banner + coloured accent stripe on the current jsPDF page.
 * @see utils/__tests__/pdfHelpers.test.js
 */
export function drawPdfPageHeader(doc, { width, height, accentHeight, accent = TEAL }) {
  doc.setFillColor(...DARK);
  doc.rect(0, 0, width, height, 'F');
  doc.setFillColor(...accent);
  doc.rect(0, 0, width, accentHeight, 'F');
}

/**
 * Dynamically imports jsPDF + jspdf-autotable, resolving both v3/v4 export shapes.
 * @see utils/__tests__/pdfHelpers.test.js
 */
export async function loadPdf() {
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.jsPDF ?? jsPDFModule.default;
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default ?? autoTableModule.autoTable;
  return { jsPDF, autoTable };
}
