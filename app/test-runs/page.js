'use client';

import { useState, useEffect } from 'react';
import ToastProvider, { showToast } from '@/components/Toast';
import { normalizedStatus, dateStamp } from '@/utils/formatters';
import { buildModuleMap } from '@/utils/buildModuleMap';
import { loadPdf, drawPdfPageHeader } from '@/utils/pdfHelpers';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default function TestRunsPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState('');

  useEffect(() => {
    fetch('/api/test-runs')
      .then((r) => r.json())
      .then((d) => { setRuns(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  async function downloadReport(run) {
    setDownloading(run._id);
    try {
      const res = await fetch(`/api/export-data?testRunId=${run._id}`);
      const cases = await res.json();
      if (!cases.length) { showToast('No test cases for this run', 'info'); return; }

      const { jsPDF, autoTable } = await loadPdf();

      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.width;
      const ML = 36, MR = 36;

      const total   = cases.length;
      const passed  = cases.filter((t) => normalizedStatus(t.status) === 'Pass').length;
      const failed  = cases.filter((t) => normalizedStatus(t.status) === 'Fail').length;
      const pending = total - passed - failed;

      // Header
      drawPdfPageHeader(doc, { width: W, height: 100, accentHeight: 4 });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.text('Regression Testing Report', ML, 46);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`File: ${run.uploadedFileName}  ·  ${run.testEnvironment || 'QA'}  ·  v${run.softwareVersion || 'N/A'}`, ML, 64);
      doc.text(`Generated: ${new Date().toLocaleString()}`, ML, 80);

      // Summary stats
      let y = 120;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text('Test Run Summary', ML, y); y += 16;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(`Total: ${total}   Passed: ${passed}   Failed: ${failed}   Pending: ${pending}   Pass Rate: ${total ? Math.round((passed/total)*100) : 0}%`, ML, y);
      y += 14;
      doc.text(`Imported: ${new Date(run.createdAt).toLocaleString()}`, ML, y);

      const moduleRows = buildModuleMap(cases);

      y += 24;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('Module Summary', ML, y);

      autoTable(doc, {
        startY: y + 8,
        head: [['Module', 'Application', 'Total', 'Pass', 'Fail', 'Pending', 'Pass Rate']],
        body: moduleRows.map((m) => {
          const pct = m.total ? Math.round((m.pass / m.total) * 100) : 0;
          return [m.module, m.app, m.total, m.pass, m.fail, m.pending, `${pct}%`];
        }),
        margin: { left: ML, right: MR },
        styles: { fontSize: 8, cellPadding: 4, halign: 'center' },
        headStyles: { fillColor: [30, 41, 59], textColor: 255, halign: 'center' },
        columnStyles: {
          0: { cellWidth: 155, halign: 'left' }, 1: { cellWidth: 120, halign: 'left' },
          2: { cellWidth: 46 }, 3: { cellWidth: 46, textColor: [22, 163, 74] },
          4: { cellWidth: 46, textColor: [220, 38, 38] }, 5: { cellWidth: 56, textColor: [217, 119, 6] },
          6: { cellWidth: 54 },
        },
        theme: 'striped',
      });

      // Failed cases
      const failedCases = cases.filter((t) => normalizedStatus(t.status) === 'Fail');
      if (failedCases.length) {
        doc.addPage();
        drawPdfPageHeader(doc, { width: W, height: 32, accentHeight: 3, accent: [220, 38, 38] });
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13); doc.setFont('helvetica', 'bold');
        doc.text('Failed Test Cases', ML, 22);

        autoTable(doc, {
          startY: 44,
          head: [['#', 'Application', 'Module', 'Test Case ID', 'Test Case', 'Defects / Improvements']],
          body: failedCases.map((t, i) => [i + 1, t.applicationName || '—', t.moduleName || '—', t.testCaseId || '—', t.testCase || '—', t.defectsImprovements || '—']),
          margin: { left: ML, right: MR },
          styles: { fontSize: 8, cellPadding: 5, overflow: 'linebreak' },
          headStyles: { fillColor: [153, 27, 27], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 24, halign: 'center' },
            1: { cellWidth: 80 }, 2: { cellWidth: 90 }, 3: { cellWidth: 70, halign: 'center' },
            4: { cellWidth: 120 }, 5: { cellWidth: 139 },
          },
          theme: 'grid',
        });
      }

      doc.save(`report-v${run.softwareVersion || 'NA'}-${dateStamp()}.pdf`);
      showToast('Report downloaded', 'success');
    } catch (e) {
      console.error(e);
      showToast('Download failed', 'error');
    } finally {
      setDownloading('');
    }
  }

  return (
    <div>
      <ToastProvider />
      <PageHeader eyebrow="History" title="Test Runs" sub={`Each Excel import creates a new test run. ${runs.length} total.`} />

      {loading ? (
        <EmptyState>Loading…</EmptyState>
      ) : runs.length === 0 ? (
        <EmptyState icon="⟳" title="No test runs yet">
          <p>Each Excel file you import will appear here as a test run.</p>
        </EmptyState>
      ) : (
        <div className="panel">
          <table>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Environment</th>
                <th>Version</th>
                <th>Imported</th>
                <th>Refreshed</th>
                <th>Created At</th>
                <th>Report</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run._id}>
                  <td style={{ fontWeight: 500 }}>{run.uploadedFileName}</td>
                  <td>
                    <span style={{ background: 'var(--surface-3)', border: '1px solid var(--line)', borderRadius: 5, padding: '2px 8px', fontSize: 12 }}>
                      {run.testEnvironment || '—'}
                    </span>
                  </td>
                  <td>
                    {run.softwareVersion ? (
                      <span style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.35)', borderRadius: 5, padding: '2px 8px', fontSize: 12, fontFamily: 'var(--font-mono)', color: '#0d9488', fontWeight: 600 }}>
                        v{run.softwareVersion}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    <span style={{ color: 'var(--pass)' }}>{run.importedCount || 0}</span>
                    {run.totalInFile
                      ? <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 11, marginLeft: 4 }}>/ {run.totalInFile}</span>
                      : null}
                  </td>
                  <td>
                    {(run.updatedCount || run.duplicatesSkipped || 0) > 0
                      ? <span style={{ color: '#0d9488', fontWeight: 600 }}>{run.updatedCount || run.duplicatesSkipped}</span>
                      : <span style={{ color: 'var(--muted)' }}>0</span>}
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(run.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => downloadReport(run)}
                      disabled={downloading === run._id}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {downloading === run._id ? 'Generating…' : '⬇ PDF'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
