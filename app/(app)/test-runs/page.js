import DownloadPdfButton from '@/components/DownloadPdfButton';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import ToastProvider from '@/components/Toast';
import { authOptions } from '@/lib/auth';
import { listTestRuns } from '@/lib/db/testRunsData';
import { getDb } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';

export default async function TestRunsPage() {
  const session = await getServerSession(authOptions);
  const db = await getDb();
  const testRuns = await listTestRuns(db, session.user.teamId);

  const runs = testRuns.map((r) => ({
    _id: r._id.toString(),
    uploadedFileName: r.uploadedFileName,
    testEnvironment: r.testEnvironment,
    softwareVersion: r.softwareVersion,
    importedCount: r.importedCount,
    totalInFile: r.totalInFile,
    updatedCount: r.updatedCount,
    duplicatesSkipped: r.duplicatesSkipped,
    createdAt:
      r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  }));

  return (
    <div>
      <ToastProvider />
      <PageHeader
        eyebrow='History'
        title='Test Runs'
        sub={`Each Excel import creates a new test run. ${runs.length} total.`}
      />

      {runs.length === 0 ? (
        <EmptyState icon='⟳' title='No test runs yet'>
          <p>Each Excel file you import will appear here as a test run.</p>
        </EmptyState>
      ) : (
        <div className='panel'>
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
                    <span
                      style={{
                        background: 'var(--surface-3)',
                        border: '1px solid var(--line)',
                        borderRadius: 5,
                        padding: '2px 8px',
                        fontSize: 12,
                      }}
                    >
                      {run.testEnvironment || '—'}
                    </span>
                  </td>
                  <td>
                    {run.softwareVersion ? (
                      <span
                        className='font-mono'
                        style={{
                          background: 'rgba(13,148,136,0.1)',
                          border: '1px solid rgba(13,148,136,0.35)',
                          borderRadius: 5,
                          padding: '2px 8px',
                          fontSize: 12,
                          color: '#0d9488',
                          fontWeight: 600,
                        }}
                      >
                        v{run.softwareVersion}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    <span style={{ color: 'var(--pass)' }}>
                      {run.importedCount || 0}
                    </span>
                    {run.totalInFile ? (
                      <span
                        style={{
                          color: 'var(--muted)',
                          fontWeight: 400,
                          fontSize: 11,
                          marginLeft: 4,
                        }}
                      >
                        / {run.totalInFile}
                      </span>
                    ) : null}
                  </td>
                  <td>
                    {(run.updatedCount || run.duplicatesSkipped || 0) > 0 ? (
                      <span style={{ color: '#0d9488', fontWeight: 600 }}>
                        {run.updatedCount || run.duplicatesSkipped}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>0</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 12 }}>
                    {new Date(run.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <DownloadPdfButton run={run} />
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
