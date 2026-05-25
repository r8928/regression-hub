'use client';

import PageHeader from '@/components/PageHeader';
import Panel from '@/components/Panel';
import ToastProvider, { showToast } from '@/components/Toast';
import { exportData as apiExportData } from '@/lib/api/exportData';
import { putSettings } from '@/lib/api/settings';
import { bulkUpdateTestCases } from '@/lib/api/testCasesBulk';
import {
  completeVersion as apiCompleteVersion,
  deleteVersion as apiDeleteVersion,
  restoreVersion as apiRestoreVersion,
  getVersionHistoryDetail,
  listVersions,
} from '@/lib/api/versions';
import { STATUS } from '@/lib/constants';
import { dateStamp, normalizedStatus } from '@/utils/formatters';
import { generateSignoffReport } from '@/utils/pdf/generateSignoffReport';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function ReportsClient({
  user: _user,
  initialVersions,
  initialSettings,
  initialApplications,
  initialApplicationId,
}) {
  const router = useRouter();
  const applications = initialApplications;
  const [versions, setVersions] = useState(initialVersions);
  const [selectedApp, setSelectedApp] = useState(initialApplicationId);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [environment, setEnvironment] = useState(
    initialSettings.testEnvironment,
  );
  const [version, setVersion] = useState(initialSettings.softwareVersion);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingVersion, setGeneratingVersion] = useState('');
  const [deletingVersion, setDeletingVersion] = useState('');
  const [restoringVersion, setRestoringVersion] = useState('');
  const [confirmRestore, setConfirmRestore] = useState(null); // { version, isCurrent } pending confirmation
  const [confirmComplete, setConfirmComplete] = useState(null); // version string
  const [completingVersion, setCompletingVersion] = useState('');
  const [versionFilter, setVersionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewModal, setViewModal] = useState(null); // { version, summary, byModule, byTester }
  const [viewLoading, setViewLoading] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { ver, isCurrent, msg }

  useEffect(() => {
    setVersions(initialVersions);
  }, [initialVersions]);

  const fetchVersions = useCallback(() => {
    listVersions({ silentFailure: true }).then((v) => {
      if (v) setVersions(v);
    });
  }, []);

  // Auto-refresh versions every 15 seconds so new versions appear without a page reload
  useEffect(() => {
    const id = setInterval(fetchVersions, 15000);
    return () => clearInterval(id);
  }, [fetchVersions]);

  function handleAppChange(id) {
    setSelectedApp(id);
    const params = new URLSearchParams(id ? { applicationId: id } : {});
    router.push(`/reports${params.size ? '?' + params : ''}`);
  }

  function deleteVersion(ver, isCurrent) {
    const msg = isCurrent
      ? `Delete ALL test cases for active version "${ver}"?\n\nThis permanently removes them and cannot be undone.`
      : `Remove the historical snapshot for version "${ver}"?\n\nThis removes the saved history entry but leaves the current test cases untouched.`;
    setConfirmDelete({ ver, isCurrent, msg });
  }

  async function doDelete({ ver, isCurrent }) {
    setConfirmDelete(null);
    setDeletingVersion(ver);
    try {
      const data = await apiDeleteVersion({ version: ver, isCurrent });
      if (selectedVersion === ver) setSelectedVersion('');
      showToast(
        isCurrent
          ? `Deleted ${data.deleted} test cases for v${ver}`
          : `Removed history snapshot for v${ver} from ${data.deleted} test case(s)`,
        'success',
      );
      router.refresh();
    } catch (e) {
      showToast(e.message || 'Delete failed', 'error');
    } finally {
      setDeletingVersion('');
    }
  }

  async function viewVersion(ver) {
    setViewLoading(ver);
    try {
      const data = await getVersionHistoryDetail(ver);
      setViewModal(data);
    } catch (e) {
      showToast(e.message || 'Failed to load version detail', 'error');
    } finally {
      setViewLoading('');
    }
  }

  function restoreVersion(ver, isCurrent) {
    setConfirmRestore({ version: ver, isCurrent });
  }

  async function doRestore({ version: ver, isCurrent }) {
    setConfirmRestore(null);
    setRestoringVersion(ver);
    try {
      if (isCurrent) {
        // ACTIVE version: bulk-retag all test cases to this version
        await bulkUpdateTestCases({
          filter: {},
          fields: { softwareVersionTested: ver },
        });
        showToast(`All test cases set to v${ver}`, 'success');
      } else {
        // Historical version: restore from history[] snapshot
        const data = await apiRestoreVersion(ver);
        showToast(`Restored ${data.restored} test cases to v${ver}`, 'success');
      }
      // Sync the active version across the UI immediately
      setVersion(ver);
      router.refresh();
    } catch (e) {
      showToast(e.message || 'Restore failed', 'error');
    } finally {
      setRestoringVersion('');
    }
  }

  async function markComplete(ver) {
    setConfirmComplete(null);
    setCompletingVersion(ver);
    try {
      const data = await apiCompleteVersion(ver);
      showToast(
        `v${ver} marked as completed — ${data.snapshotted} test cases snapshotted`,
        'success',
      );
      router.refresh();
    } catch (e) {
      showToast(e.message || 'Failed to complete version', 'error');
    } finally {
      setCompletingVersion('');
    }
  }

  async function exportExcel(overrideVersion) {
    const isCustomExport = overrideVersion === undefined;
    try {
      const params = new URLSearchParams();
      if (selectedApp) params.set('applicationId', selectedApp);
      const ver = overrideVersion ?? selectedVersion;
      if (ver) params.set('softwareVersion', ver);
      const cases = await apiExportData(Object.fromEntries(params));
      if (!cases?.length) {
        showToast('No test cases to export', 'info');
        return;
      }

      const { utils, writeFile } = await import('xlsx');
      const rows = cases.map((tc) => ({
        'Platform/Application': tc.applicationName,
        Module: tc.moduleName,
        Type: tc.type,
        Traceability: tc.traceability,
        'Test Case ID': tc.testCaseId,
        'Test Case': tc.testCase,
        Preconditions: tc.preconditions,
        Steps: tc.steps,
        'Expected Result': tc.expectedResult,
        'Actual Result': tc.actualResult,
        Status: normalizedStatus(tc.status),
        'Defects/Improvements': tc.defectsImprovements,
        'Tested By': tc.testedBy,
        'Tested On': tc.testedOn,
        'Software Version Tested': tc.softwareVersionTested,
      }));

      // Summary sheet
      const summaryRows = [
        ['Metric', 'Value'],
        [
          'Application',
          selectedApp
            ? applications.find((a) => a._id === selectedApp)?.name
            : 'All',
        ],
        ['Environment', environment],
        ['Version', version || 'Not specified'],
        ['Total Test Cases', cases.length],
        [
          'Passed',
          cases.filter((t) => normalizedStatus(t.status) === STATUS.PASS)
            .length,
        ],
        [
          'Failed',
          cases.filter((t) => normalizedStatus(t.status) === STATUS.FAIL)
            .length,
        ],
        [
          'Pending',
          cases.filter((t) => normalizedStatus(t.status) === STATUS.PENDING)
            .length,
        ],
        ['Generated', new Date().toLocaleString()],
      ];

      const wb = utils.book_new();
      const wsSummary = utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols'] = [{ wch: 24 }, { wch: 30 }];
      utils.book_append_sheet(wb, wsSummary, 'Summary');

      const wsData = utils.json_to_sheet(rows);
      wsData['!cols'] = [
        22, 18, 12, 14, 14, 24, 18, 18, 24, 24, 10, 24, 12, 14, 18,
      ].map((wch) => ({ wch }));
      utils.book_append_sheet(wb, wsData, 'Test Cases');

      writeFile(wb, `regression-report-${dateStamp()}.xlsx`);
      showToast('Excel report exported', 'success');

      // Auto-tag test cases with this version so it appears in Version History
      if (isCustomExport && version) {
        bulkUpdateTestCases(
          {
            filter: { applicationId: selectedApp || undefined },
            fields: { softwareVersionTested: version },
          },
          { silentFailure: true },
        ).then(() => router.refresh());
      }
    } catch (e) {
      console.error(e);
      showToast('Export failed', 'error');
    }
  }

  async function exportPdf(overrideVersion) {
    const isVersionExport = overrideVersion !== undefined;
    if (isVersionExport) setGeneratingVersion(overrideVersion);
    else setGeneratingPdf(true);
    try {
      const params = new URLSearchParams();
      if (selectedApp) params.set('applicationId', selectedApp);
      const ver = overrideVersion ?? selectedVersion;
      if (ver) params.set('softwareVersion', ver);
      const cases = await apiExportData(Object.fromEntries(params));
      if (!cases.length) {
        showToast('No test cases to export', 'info');
        if (isVersionExport) setGeneratingVersion('');
        else setGeneratingPdf(false);
        return;
      }

      const appName = selectedApp
        ? applications.find((a) => a._id === selectedApp)?.name
        : 'All Applications';

      const doc = await generateSignoffReport({
        cases,
        appName,
        environment,
        version,
      });
      doc.save(`regression-signoff-${dateStamp()}.pdf`);
      showToast('PDF exported', 'success');

      // Auto-tag test cases with this version so it appears in Version History
      if (!isVersionExport && version) {
        bulkUpdateTestCases(
          {
            filter: { applicationId: selectedApp || undefined },
            fields: { softwareVersionTested: version },
          },
          { silentFailure: true },
        ).then(() => router.refresh());
      }
    } catch (e) {
      console.error(e);
      showToast('PDF export failed', 'error');
    } finally {
      setGeneratingPdf(false);
      setGeneratingVersion('');
    }
  }

  return (
    <Box>
      <ToastProvider />
      <PageHeader
        eyebrow='Exports'
        title='Reports'
        sub='Generate PDF signoff reports and Excel exports'
      />

      {/* Version History */}
      {versions.length > 0 && (
        <Paper variant='outlined' sx={{ mb: 2.5 }}>
          <Stack
            direction='row'
            spacing={1.25}
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              px: 2.5,
              py: 2,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant='panelTitle' component='h2'>
              Version History
            </Typography>
            <Stack
              direction='row'
              spacing={1}
              sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            >
              {/* Version search filter */}
              <TextField
                size='small'
                value={versionFilter}
                onChange={(e) => setVersionFilter(e.target.value)}
                label='Version'
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon color='disabled' />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ width: 160 }}
              />
              {/* Status filter */}
              <TextField
                select
                size='small'
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                slotProps={{
                  inputLabel: { shrink: true },
                  select: { displayEmpty: true },
                }}
                label='Status'
                sx={{ width: 160 }}
              >
                <MenuItem value=''>All statuses</MenuItem>
                <MenuItem value='active'>Active only</MenuItem>
                <MenuItem value='completed'>Completed only</MenuItem>
              </TextField>
              <Typography variant='body2' color='text.disabled'>
                click a row to select for export
              </Typography>
            </Stack>
          </Stack>

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
                  <TableCell>Version</TableCell>
                  <TableCell align='center'>Total</TableCell>
                  <TableCell align='center'>Pass</TableCell>
                  <TableCell align='center'>Fail</TableCell>
                  <TableCell align='center'>Pending</TableCell>
                  <TableCell align='center'>Pass Rate</TableCell>
                  <TableCell align='right'>Last Updated</TableCell>
                  <TableCell align='center'>Export</TableCell>
                  <TableCell align='center' sx={{ width: 72 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {versions
                  .filter((v) => {
                    if (
                      versionFilter &&
                      !v.version
                        .toLowerCase()
                        .includes(versionFilter.toLowerCase())
                    )
                      return false;
                    if (statusFilter === 'active' && !v.isCurrent) return false;
                    if (statusFilter === 'completed' && v.isCurrent)
                      return false;
                    return true;
                  })
                  .map((v) => {
                    const isSelected = selectedVersion === v.version;
                    return (
                      <TableRow
                        key={v.version}
                        hover
                        onClick={() =>
                          setSelectedVersion(isSelected ? '' : v.version)
                        }
                        sx={{
                          cursor: 'pointer',
                          bgcolor: isSelected
                            ? 'rgba(13,148,136,0.07)'
                            : undefined,
                          outline: isSelected
                            ? '2px solid rgba(13,148,136,0.35)'
                            : undefined,
                        }}
                      >
                        <TableCell>
                          <Stack
                            direction='row'
                            spacing={1}
                            sx={{ alignItems: 'center' }}
                          >
                            {isSelected && (
                              <Box
                                component='span'
                                sx={{ color: 'primary.main' }}
                              >
                                ●
                              </Box>
                            )}
                            <Box
                              component='span'
                              sx={{
                                bgcolor: 'rgba(13,148,136,0.1)',
                                border: '1px solid rgba(13,148,136,0.3)',
                                borderRadius: 0.75,
                                px: 1.25,
                                py: 0.25,
                                color: 'success.dark',
                              }}
                            >
                              v{v.version}
                            </Box>
                            {v.isCurrent ? (
                              <Chip
                                label='ACTIVE'
                                size='small'
                                color='success'
                                variant='outlined'
                              />
                            ) : (
                              <Chip
                                label='completed'
                                size='small'
                                variant='outlined'
                                sx={{
                                  color: 'text.disabled',
                                  borderColor: 'divider',
                                }}
                              />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell align='center'>{v.total}</TableCell>
                        <TableCell align='center'>
                          <Typography
                            component='span'
                            sx={{ color: 'success.main' }}
                          >
                            {v.passed}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Typography
                            component='span'
                            sx={{
                              color:
                                v.failed > 0 ? 'error.main' : 'text.disabled',
                            }}
                          >
                            {v.failed}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Typography
                            component='span'
                            sx={{ color: 'warning.main' }}
                          >
                            {v.pending}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Stack
                            direction='row'
                            spacing={0.75}
                            sx={{
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Box sx={{ flex: 1, maxWidth: 60 }}>
                              <LinearProgress
                                variant='determinate'
                                value={v.passRate}
                                color='success'
                                sx={{ height: 5, borderRadius: 1.5 }}
                              />
                            </Box>
                            <Typography sx={{ minWidth: 32 }}>
                              {v.passRate}%
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography color='text.disabled'>
                            {v.lastUpdated
                              ? new Date(v.lastUpdated).toLocaleDateString()
                              : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align='center'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Stack
                            direction='row'
                            spacing={0.625}
                            sx={{ justifyContent: 'center', flexWrap: 'wrap' }}
                          >
                            {!v.isCurrent && (
                              <Button
                                variant='outlined'
                                size='small'
                                onClick={() => viewVersion(v.version)}
                                disabled={viewLoading === v.version}
                                sx={{ minWidth: 0 }}
                              >
                                {viewLoading === v.version ? '…' : '👁 View'}
                              </Button>
                            )}
                            <Button
                              variant='outlined'
                              size='small'
                              onClick={() => exportExcel(v.version)}
                              sx={{ minWidth: 0 }}
                            >
                              Excel
                            </Button>
                            <Button
                              variant='contained'
                              color='primary'
                              size='small'
                              onClick={() => exportPdf(v.version)}
                              disabled={generatingVersion === v.version}
                              sx={{ minWidth: 0 }}
                            >
                              {generatingVersion === v.version ? '…' : 'PDF'}
                            </Button>
                          </Stack>
                        </TableCell>
                        <TableCell
                          align='center'
                          onClick={(e) => e.stopPropagation()}
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          {/* Mark Complete icon — only for ACTIVE versions */}
                          {v.isCurrent && (
                            <IconButton
                              size='small'
                              onClick={() => setConfirmComplete(v.version)}
                              disabled={completingVersion === v.version}
                              title={`Mark v${v.version} as completed`}
                              color='success'
                              sx={{
                                opacity:
                                  completingVersion === v.version ? 0.4 : 0.75,
                                '&:hover': { opacity: 1 },
                              }}
                            >
                              <CheckCircleOutlinedIcon />
                            </IconButton>
                          )}
                          {/* Restore icon — shown on ALL rows */}
                          <IconButton
                            size='small'
                            onClick={() =>
                              restoreVersion(v.version, v.isCurrent)
                            }
                            disabled={restoringVersion === v.version}
                            title={
                              v.isCurrent
                                ? `Set all test cases to v${v.version}`
                                : `Restore test cases to saved state from v${v.version}`
                            }
                            color='primary'
                            sx={{
                              opacity:
                                restoringVersion === v.version ? 0.4 : 0.75,
                              '&:hover': { opacity: 1 },
                            }}
                          >
                            <HistoryIcon fontSize='small' />
                          </IconButton>
                          <IconButton
                            size='small'
                            onClick={() =>
                              deleteVersion(v.version, v.isCurrent)
                            }
                            disabled={deletingVersion === v.version}
                            title={
                              v.isCurrent
                                ? `Delete all test cases for v${v.version}`
                                : `Remove history snapshot for v${v.version}`
                            }
                            color='error'
                            sx={{
                              opacity:
                                deletingVersion === v.version ? 0.4 : 0.7,
                              '&:hover': { opacity: 1 },
                            }}
                          >
                            <DeleteOutlinedIcon fontSize='small' />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          {selectedVersion && (
            <Stack
              direction='row'
              spacing={1.25}
              sx={{
                alignItems: 'center',
                px: 2.5,
                py: 1.25,
                bgcolor: 'rgba(13,148,136,0.05)',
                borderTop: '1px solid rgba(13,148,136,0.15)',
              }}
            >
              <Typography component='span' sx={{ color: 'primary.main' }}>
                ● Selected: v{selectedVersion}
              </Typography>
              <Typography component='span' color='text.disabled'>
                — custom export below will use this version
              </Typography>
              <Button
                variant='text'
                size='small'
                onClick={() => setSelectedVersion('')}
                sx={{ ml: 'auto !important', color: 'text.disabled' }}
              >
                Clear ×
              </Button>
            </Stack>
          )}
        </Paper>
      )}

      <Panel
        title={
          <>
            Custom Export{' '}
            {selectedVersion && (
              <Typography component='span' sx={{ color: 'primary.main' }}>
                — scoped to v{selectedVersion}
              </Typography>
            )}
          </>
        }
        sx={{ mb: 2.5 }}
      >
        <Box sx={{ p: 2.5 }}>
          <Stack
            direction='row'
            spacing={1.75}
            sx={{ mb: 1.75, flexWrap: 'wrap' }}
          >
            <TextField
              select
              label='Application / Scope'
              value={selectedApp}
              onChange={(e) => handleAppChange(e.target.value)}
              sx={{ minWidth: 180, flex: 1 }}
              slotProps={{
                inputLabel: { shrink: true },
                input: { notched: true },
                select: { displayEmpty: true },
              }}
            >
              <MenuItem value=''>All Applications</MenuItem>
              {applications.map((a) => (
                <MenuItem key={a._id} value={a._id}>
                  {a.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label='Test Environment'
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              onBlur={() =>
                putSettings(
                  { testEnvironment: environment, softwareVersion: version },
                  { silentFailure: true },
                )
              }
              placeholder='e.g. QA, Staging'
              sx={{ minWidth: 180, flex: 1 }}
            />
            <TextField
              label='Software Version (for PDF header)'
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              onBlur={() =>
                putSettings(
                  { testEnvironment: environment, softwareVersion: version },
                  { silentFailure: true },
                )
              }
              placeholder='e.g. 2.4.1'
              sx={{ minWidth: 180, flex: 1 }}
            />
          </Stack>
          <Stack direction='row' spacing={1.25}>
            <Button variant='outlined' onClick={() => exportExcel()}>
              Export Excel
            </Button>
            <Button
              variant='contained'
              color='primary'
              onClick={() => exportPdf()}
              disabled={generatingPdf}
            >
              {generatingPdf ? 'Generating…' : 'Export PDF Signoff'}
            </Button>
          </Stack>
        </Box>
      </Panel>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Delete Version?</DialogTitle>
        <DialogContent>
          <Typography variant='body2' sx={{ whiteSpace: 'pre-line' }}>
            {confirmDelete?.msg}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={() => doDelete(confirmDelete)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog
        open={!!confirmRestore}
        onClose={() => setConfirmRestore(null)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Restore to v{confirmRestore?.version}?</DialogTitle>
        <DialogContent>
          {confirmRestore?.isCurrent ? (
            <Typography variant='body2'>
              All test cases across every version will be{' '}
              <strong>retagged to v{confirmRestore.version}</strong>,
              consolidating everything into a single active version.
            </Typography>
          ) : (
            <>
              <Typography variant='body2' sx={{ mb: 1.25 }}>
                All current test case results will be{' '}
                <strong>
                  reset to their saved state from v{confirmRestore?.version}
                </strong>
                .
              </Typography>
              <Typography variant='body2'>
                Your current state is automatically saved as a history entry —
                you can always restore back to it.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' onClick={() => setConfirmRestore(null)}>
            Cancel
          </Button>
          <Button
            variant='contained'
            color='primary'
            onClick={() => doRestore(confirmRestore)}
          >
            Yes, Restore
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mark Complete Confirmation Dialog */}
      <Dialog
        open={!!confirmComplete}
        onClose={() => setConfirmComplete(null)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Mark v{confirmComplete} as Completed?</DialogTitle>
        <DialogContent>
          <Typography variant='body2'>
            This saves a snapshot of all test case results for v
            {confirmComplete} and marks the testing cycle as{' '}
            <strong>done</strong>. The version will appear as{' '}
            <strong>completed</strong> in history and can be viewed or restored
            anytime.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' onClick={() => setConfirmComplete(null)}>
            Cancel
          </Button>
          <Button
            variant='contained'
            color='success'
            onClick={() => markComplete(confirmComplete)}
          >
            Yes, Mark Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Version History Detail Dialog */}
      <Dialog
        open={!!viewModal}
        onClose={() => setViewModal(null)}
        maxWidth='md'
        fullWidth
        PaperProps={{ sx: { maxHeight: '88vh' } }}
      >
        <DialogTitle>
          <Stack direction='row' spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              component='span'
              sx={{
                bgcolor: 'rgba(13,148,136,0.1)',
                border: '1px solid rgba(13,148,136,0.3)',
                borderRadius: 0.75,
                px: 1.5,
                py: 0.375,
                color: 'success.dark',
              }}
            >
              v{viewModal?.version}
            </Box>
            <Chip
              label='Historical Snapshot'
              size='small'
              sx={{
                bgcolor: 'grey.100',
                color: 'text.secondary',
              }}
            />
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {/* Summary row */}
          <Stack
            direction='row'
            spacing={1.25}
            sx={{ mb: 3, flexWrap: 'wrap' }}
          >
            {[
              {
                label: 'Total',
                value: viewModal?.summary.total,
                color: 'text.primary',
              },
              {
                label: 'Passed',
                value: viewModal?.summary.passed,
                color: 'success.dark',
              },
              {
                label: 'Failed',
                value: viewModal?.summary.failed,
                color: 'error.main',
              },
              {
                label: 'Pending',
                value: viewModal?.summary.pending,
                color: 'warning.main',
              },
              {
                label: 'Pass Rate',
                value: `${viewModal?.summary.passRate}%`,
                color:
                  (viewModal?.summary.passRate ?? 0) >= 80
                    ? 'success.dark'
                    : 'warning.main',
              },
            ].map(({ label, value, color }) => (
              <Box
                key={label}
                sx={{
                  flex: 1,
                  minWidth: 80,
                  bgcolor: 'background.default',
                  p: '12px 16px',
                  textAlign: 'center',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography
                  sx={{
                    color: 'text.disabled',
                    mb: 0.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {label}
                </Typography>
                <Typography sx={{ color }}>{value}</Typography>
              </Box>
            ))}
          </Stack>

          {/* Module breakdown */}
          {viewModal?.byModule.length > 0 && (
            <Box sx={{ mb: 2.75 }}>
              <Typography sx={{ mb: 1.25 }}>Module Breakdown</Typography>
              <TableContainer>
                <Table size='small'>
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
                      <TableCell>Module</TableCell>
                      <TableCell align='center'>Total</TableCell>
                      <TableCell align='center' sx={{ color: 'success.dark' }}>
                        Pass
                      </TableCell>
                      <TableCell align='center' sx={{ color: 'error.main' }}>
                        Fail
                      </TableCell>
                      <TableCell align='center' sx={{ color: 'warning.main' }}>
                        Pending
                      </TableCell>
                      <TableCell align='center'>Pass Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewModal.byModule.map((m, i) => (
                      <TableRow key={`${m.module}-${i}`}>
                        <TableCell>{m.module}</TableCell>
                        <TableCell align='center'>{m.total}</TableCell>
                        <TableCell
                          align='center'
                          sx={{ color: 'success.dark' }}
                        >
                          {m.passed}
                        </TableCell>
                        <TableCell
                          align='center'
                          sx={{
                            color:
                              m.failed > 0 ? 'error.main' : 'text.disabled',
                          }}
                        >
                          {m.failed}
                        </TableCell>
                        <TableCell
                          align='center'
                          sx={{
                            color:
                              m.pending > 0 ? 'warning.main' : 'text.disabled',
                          }}
                        >
                          {m.pending}
                        </TableCell>
                        <TableCell>
                          <Stack
                            direction='row'
                            spacing={0.75}
                            sx={{ alignItems: 'center' }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress
                                variant='determinate'
                                value={m.passRate}
                                color='success'
                                sx={{ height: 5, borderRadius: 1.5 }}
                              />
                            </Box>
                            <Typography
                              sx={{
                                color: 'text.disabled',
                                minWidth: 30,
                                textAlign: 'right',
                              }}
                            >
                              {m.passRate}%
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tester breakdown */}
          {viewModal?.byTester.length > 0 && (
            <Box sx={{ mb: 2.75 }}>
              <Typography sx={{ mb: 1.25 }}>Tester Breakdown</Typography>
              <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
                {viewModal.byTester.map((t) => (
                  <Box
                    key={t.tester}
                    sx={{
                      bgcolor: 'background.default',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: '10px 16px',
                      minWidth: 140,
                    }}
                  >
                    <Typography sx={{ mb: 0.75 }}>{t.tester}</Typography>
                    <Stack direction='row' spacing={1}>
                      <Typography
                        component='span'
                        sx={{
                          color: 'success.dark',
                        }}
                      >
                        {t.passed}P
                      </Typography>
                      <Typography
                        component='span'
                        sx={{
                          color: 'error.main',
                        }}
                      >
                        {t.failed}F
                      </Typography>
                      <Typography
                        component='span'
                        sx={{ color: 'warning.main' }}
                      >
                        {t.pending} pending
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {viewModal?.summary.total === 0 && (
            <Box sx={{ py: 3.75, textAlign: 'center' }}>
              <Typography color='text.disabled'>
                No snapshot data found for this version. Try re-importing a
                newer version to generate history.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant='outlined'
            onClick={() => exportExcel(viewModal?.version)}
          >
            Export Excel
          </Button>
          <Button
            variant='outlined'
            onClick={() => exportPdf(viewModal?.version)}
          >
            Export PDF
          </Button>
          <Button
            variant='contained'
            color='primary'
            onClick={() => {
              setViewModal(null);
              setConfirmRestore({
                version: viewModal.version,
                isCurrent: false,
              });
            }}
            disabled={restoringVersion === viewModal?.version}
          >
            ↩ Restore to This Version
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
