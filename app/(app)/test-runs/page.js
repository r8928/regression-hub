import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { getServerSession } from 'next-auth';
import DownloadPdfButton from '@/components/DownloadPdfButton';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import { authOptions } from '@/lib/auth';
import { listTestRuns } from '@/lib/db/testRunsData';
import { getDb } from '@/lib/mongodb';

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
    <>
      <PageHeader
        eyebrow='History'
        title='Test Runs'
        sub={`Each Excel import creates a new test run. ${runs.length} total.`}
      />

      {runs.length === 0 ? (
        <EmptyState icon={<RefreshOutlined />} title='No test runs yet'>
          <p>Each Excel file you import will appear here as a test run.</p>
        </EmptyState>
      ) : (
        <Panel title='Import History'>
          <TableContainer>
            <Table size='small' stickyHeader>
              <TableHead
                sx={{
                  '& th': {
                    bgcolor: 'action.selected',
                    borderBottomWidth: 2,
                    borderBottomColor: 'divider',
                  },
                }}
              >
                <TableRow>
                  <TableCell>File Name</TableCell>
                  <TableCell>Environment</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Imported</TableCell>
                  <TableCell>Refreshed</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Report</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run._id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {run.uploadedFileName}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={run.testEnvironment || '—'}
                        size='small'
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>
                      {run.softwareVersion ? (
                        <Chip
                          label={`v${run.softwareVersion}`}
                          size='small'
                          color='primary'
                          variant='outlined'
                          sx={{ fontFamily: 'monospace', fontWeight: 700 }}
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Box
                        component='span'
                        sx={{ color: 'success.main', fontWeight: 600 }}
                      >
                        {run.importedCount || 0}
                      </Box>
                      {run.totalInFile ? (
                        <Box
                          component='span'
                          sx={{
                            color: 'text.disabled',
                            fontWeight: 400,
                            fontSize: 11,
                            ml: 0.5,
                          }}
                        >
                          / {run.totalInFile}
                        </Box>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {(run.updatedCount || run.duplicatesSkipped || 0) > 0 ? (
                        <Box
                          component='span'
                          sx={{ color: 'primary.main', fontWeight: 600 }}
                        >
                          {run.updatedCount || run.duplicatesSkipped}
                        </Box>
                      ) : (
                        <Box component='span' sx={{ color: 'text.disabled' }}>
                          0
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'text.disabled', fontSize: 12 }}>
                      {new Date(run.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DownloadPdfButton run={run} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Panel>
      )}
    </>
  );
}
