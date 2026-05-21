import { describe, it, expect, vi } from 'vitest';
import { drawPdfPageHeader, loadPdf } from '../pdfHelpers';

describe('drawPdfPageHeader', () => {
  it('draws dark banner + teal accent stripe with given heights', () => {
    const doc = { setFillColor: vi.fn(), rect: vi.fn() };
    drawPdfPageHeader(doc, { width: 595, height: 100, accentHeight: 4 });
    expect(doc.setFillColor).toHaveBeenNthCalledWith(1, 15, 23, 42);
    expect(doc.rect).toHaveBeenNthCalledWith(1, 0, 0, 595, 100, 'F');
    expect(doc.setFillColor).toHaveBeenNthCalledWith(2, 13, 148, 136);
    expect(doc.rect).toHaveBeenNthCalledWith(2, 0, 0, 595, 4, 'F');
  });

  it('accepts a custom accent color (e.g. red for failure pages)', () => {
    const doc = { setFillColor: vi.fn(), rect: vi.fn() };
    drawPdfPageHeader(doc, { width: 800, height: 32, accentHeight: 3, accent: [220, 38, 38] });
    expect(doc.setFillColor).toHaveBeenLastCalledWith(220, 38, 38);
  });
});

describe('loadPdf', () => {
  it('returns { jsPDF, autoTable } resolved across v3/v4 export shapes', async () => {
    const { jsPDF, autoTable } = await loadPdf();
    expect(typeof jsPDF).toBe('function');
    expect(typeof autoTable).toBe('function');
  });
});
