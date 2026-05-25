'use client';

import SearchOffOutlined from '@mui/icons-material/SearchOffOutlined';
import {
  Box,
  Button,
  Chip,
  Dialog,
  TablePagination,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Skeleton,
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
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import RichTextEditor from '@/components/RichTextEditor';
import TestCaseRow from '@/components/TestCaseRow';
import ToastProvider, { showToast } from '@/components/Toast';
import { useQaUsers } from '@/hooks/useSharedData';
import { createAssignment } from '@/lib/api/assignments';
import { createModule as apiCreateModule } from '@/lib/api/modules';
import { getSettings, putSettings } from '@/lib/api/settings';
import {
  createTestCase,
  listTestCases,
  resetTeamTestCases,
  updateTestCase,
} from '@/lib/api/testCases';
import { bulkUpdateTestCases } from '@/lib/api/testCasesBulk';
import {
  CONFIRM_TOKENS,
  PRIORITIES,
  PRIORITY_DEFAULT,
  ROLES,
  STATUS,
  UNASSIGNED_SENTINEL,
} from '@/lib/constants';
import { dateStamp, toDateInputValue } from '@/utils/formatters';

const EMPTY_FORM = {
  applicationId: '',
  moduleId: '',
  testCaseId: '',
  testCase: '',
  type: '',
  traceability: '',
  preconditions: '',
  steps: '',
  expectedResult: '',
  actualResult: '',
  status: '',
  defectsImprovements: '',
  testedBy: '',
  testedOn: '',
  softwareVersionTested: '',
  priority: '',
  jiraStory: '',
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function TestCasesPage({ user }) {
  const isAdmin = user.role === ROLES.ADMIN;

  const [cases, setCases] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [applications, setApplications] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addSaving, setAddSaving] = useState(false);
  const [newModuleName, setNewModuleName] = useState(null);
  const [creatingModule, setCreatingModule] = useState(false);

  // Edit modal
  const [editTc, setEditTc] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // Filters
  const [fApp, setFApp] = useState('');
  const [fMod, setFMod] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fTester, setFTester] = useState('');
  const [fVersion, setFVersion] = useState('');
  const [fAssignedTo, setFAssignedTo] = useState('');
  const [fPriority, setFPriority] = useState('');
  const [fJiraStory, setFJiraStory] = useState('');

  // Assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    assignedTo: '',
    priority: PRIORITY_DEFAULT,
    dueDate: '',
    notes: '',
    title: '',
  });
  const [assignSaving, setAssignSaving] = useState(false);

  const qaUsers = useQaUsers();

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    message: '',
    onConfirm: null,
  });
  // Prompt dialog (text input)
  const [promptDialog, setPromptDialog] = useState({
    open: false,
    value: '',
    onConfirm: null,
  });

  // Bulk fill
  const [bStatus, setBStatus] = useState('');
  const [bFromTester, setBFromTester] = useState('');
  const [bTester, setBTester] = useState('');
  const [bDate, setBDate] = useState('');
  const [bVersion, setBVersion] = useState('');
  const [bPriority, setBPriority] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Bulk edit
  const [bePriority, setBePriority] = useState('');
  const [beJiraStory, setBeJiraStory] = useState('');
  const [beApplication, setBeApplication] = useState('');
  const [beModule, setBeModule] = useState('');
  const [bulkEditLoading, setBulkEditLoading] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const versionSaveTimer = useRef(null);
  const settingsVersionRef = useRef('');
  const appsModsLoaded = useRef(false);
  const newModuleInputRef = useRef(null);

  const searchParams = useSearchParams();
  useEffect(() => {
    const assignedTo = searchParams.get('assignedTo');
    if (assignedTo) setFAssignedTo(assignedTo);
    const applicationId = searchParams.get('applicationId');
    if (applicationId) setFApp(applicationId);
    const status = searchParams.get('status');
    if (status) setFStatus(status);
    const testedBy = searchParams.get('testedBy');
    if (testedBy) setFTester(testedBy);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load settings — apps/modules come from the test-cases response
  useEffect(() => {
    getSettings({ silentFailure: true }).then((settings) => {
      if (!settings?.softwareVersion) return;
      const ver = settings.softwareVersion;
      setBVersion(ver);
      settingsVersionRef.current = ver;
      setCases((prev) =>
        prev.length
          ? prev.map((tc) => ({ ...tc, softwareVersionTested: ver }))
          : prev,
      );
    });
  }, []);

  const fetchPage = useCallback(
    async (pageNum) => {
      setLoading(true);
      setSelectedIds(new Set());
      try {
        const params = new URLSearchParams();
        if (fApp) params.set('applicationId', fApp);
        if (fMod) params.set('moduleId', fMod);
        if (fStatus) params.set('status', fStatus);
        if (fTester) params.set('testedBy', fTester);
        if (fVersion) params.set('version', fVersion);
        if (fAssignedTo) params.set('assignedTo', fAssignedTo);
        if (fPriority) params.set('priority', fPriority);
        if (fJiraStory) params.set('jiraStory', fJiraStory);
        params.set('page', pageNum);
        params.set('limit', pageSize);

        const json = await listTestCases(Object.fromEntries(params), {
          silentFailure: true,
        });
        if (!json) return;
        const {
          data = [],
          total = 0,
          applications: appsData,
          modules: modsData,
        } = json;

        // Hydrate filter dropdowns from first response (avoids separate API calls)
        if (!appsModsLoaded.current && appsData) {
          setApplications(appsData);
          setModules(modsData || []);
          appsModsLoaded.current = true;
        }

        const ver = settingsVersionRef.current;
        setCases(
          ver
            ? data.map((tc) => ({ ...tc, softwareVersionTested: ver }))
            : data,
        );
        setTotalCount(total);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [
      fApp,
      fMod,
      fStatus,
      fTester,
      fVersion,
      fAssignedTo,
      fPriority,
      fJiraStory,
      pageSize,
    ],
  );

  useEffect(() => {
    setPage(1);
    fetchPage(1);
  }, [fetchPage]);

  function goToPage(newPage) {
    setPage(newPage);
    fetchPage(newPage);
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectPage(pageIds, allSelected) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function handleVersionChange(val) {
    setBVersion(val);
    clearTimeout(versionSaveTimer.current);
    versionSaveTimer.current = setTimeout(async () => {
      settingsVersionRef.current = val;

      putSettings({ softwareVersion: val }, { silentFailure: true });

      if (!val) return;
      setCases((prev) =>
        prev.map((tc) => ({ ...tc, softwareVersionTested: val })),
      );

      bulkUpdateTestCases(
        { filter: {}, fields: { softwareVersionTested: val } },
        { silentFailure: true },
      );
    }, 800);
  }

  async function saveField(id, field, value) {
    setSaving((s) => ({ ...s, [id]: true }));
    try {
      const extra = {};
      if (
        field === 'status' &&
        (value === STATUS.PASS || value === STATUS.FAIL)
      ) {
        const today = dateStamp();
        if (bVersion) extra.softwareVersionTested = bVersion;
        extra.testedOn = today;
      }

      await updateTestCase(id, { [field]: value, ...extra });

      setCases((prev) =>
        prev.map((tc) =>
          tc._id === id ? { ...tc, [field]: value, ...extra } : tc,
        ),
      );
      showToast('Saved', 'success', 1200);
    } catch {
      showToast('Save failed', 'error');
    } finally {
      setSaving((s) => ({ ...s, [id]: false }));
    }
  }

  // --- Edit Modal ---
  function openEdit(tc) {
    setEditTc(tc);
    setEditForm({
      applicationId: tc.applicationId || '',
      moduleId: tc.moduleId || '',
      testCaseId: tc.testCaseId || '',
      type: tc.type || '',
      traceability: tc.traceability || '',
      priority: tc.priority || '',
      jiraStory: tc.jiraStory || '',
      testCase: tc.testCase || '',
      preconditions: tc.preconditions || '',
      steps: tc.steps || '',
      expectedResult: tc.expectedResult || '',
      actualResult: tc.actualResult || '',
      status: tc.status || '',
      defectsImprovements: tc.defectsImprovements || '',
      testedBy: tc.testedBy || '',
      testedOn: tc.testedOn || '',
      softwareVersionTested: tc.softwareVersionTested || '',
    });
  }

  async function saveEdit(e) {
    e.preventDefault();
    setEditSaving(true);
    try {
      await updateTestCase(editTc._id, editForm);
      showToast('Test case updated', 'success');
      const appName =
        applications.find((a) => a._id === editForm.applicationId)?.name ||
        editTc.applicationName;
      const modName =
        modules.find((m) => m._id === editForm.moduleId)?.name ||
        editTc.moduleName;
      setCases((prev) =>
        prev.map((tc) =>
          tc._id === editTc._id
            ? {
                ...tc,
                ...editForm,
                applicationName: appName,
                moduleName: modName,
              }
            : tc,
        ),
      );
      setEditTc(null);
    } catch (err) {
      showToast(err.message || 'Failed to update', 'error');
    } finally {
      setEditSaving(false);
    }
  }

  // --- Bulk Fill ---
  async function bulkFill(pendingOnly) {
    if (!bStatus && !bTester && !bDate && !bVersion && !bPriority) {
      showToast('Set at least one field', 'info');
      return;
    }

    const fields = {};
    if (bStatus) fields.status = bStatus === STATUS.PENDING ? '' : bStatus;
    if (bTester) fields.testedBy = bTester;
    if (bDate) fields.testedOn = bDate;
    if (bVersion) fields.softwareVersionTested = bVersion;
    if (bPriority) fields.priority = bPriority;
    if (bStatus && bStatus !== STATUS.PENDING && !bDate)
      fields.testedOn = dateStamp();

    setBulkLoading(true);
    try {
      let body;
      if (selectedIds.size > 0) {
        body = { ids: Array.from(selectedIds), fields, pendingOnly };
      } else {
        body = {
          filter: {
            applicationId: fApp || undefined,
            moduleId: fMod || undefined,
            testedBy: bFromTester || undefined,
            version: fVersion || undefined,
          },
          fields,
          pendingOnly,
        };
      }

      const { updated } = await bulkUpdateTestCases(body);

      if (bVersion) {
        putSettings({ softwareVersion: bVersion }, { silentFailure: true });
        settingsVersionRef.current = bVersion;
      }

      fetchPage(page);
      setSelectedIds(new Set());
      showToast(`${updated} rows updated`, 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setBulkLoading(false);
    }
  }

  // --- Bulk Edit ---
  async function bulkEdit() {
    if (!bePriority && !beJiraStory && !beApplication && !beModule) {
      showToast('Set at least one field to change', 'info');
      return;
    }
    if (selectedIds.size === 0) {
      showToast('Select rows first', 'info');
      return;
    }

    const fields = {};
    if (bePriority) fields.priority = bePriority;
    if (beJiraStory) fields.jiraStory = beJiraStory;
    if (beApplication) fields.applicationId = beApplication;
    if (beModule) fields.moduleId = beModule;

    setBulkEditLoading(true);
    try {
      const { updated } = await bulkUpdateTestCases({
        ids: Array.from(selectedIds),
        fields,
      });
      fetchPage(page);
      setSelectedIds(new Set());
      showToast(`${updated} rows updated`, 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setBulkEditLoading(false);
    }
  }

  // --- Add Test Case ---
  async function addTestCase(e) {
    e.preventDefault();
    if (!addForm.applicationId || !addForm.moduleId) {
      showToast('Select an application and module', 'info');
      return;
    }
    setAddSaving(true);
    try {
      const app = applications.find((a) => a._id === addForm.applicationId);
      const mod = modules.find((m) => m._id === addForm.moduleId);
      await createTestCase({
        ...addForm,
        applicationName: app?.name,
        moduleName: mod?.name,
      });
      showToast('Test case added', 'success');
      setShowAddModal(false);
      setAddForm(EMPTY_FORM);
      setNewModuleName(null);
      setTotalCount((n) => n + 1);
      fetchPage(page);
    } catch (err) {
      showToast(err.message || 'Failed to add', 'error');
    } finally {
      setAddSaving(false);
    }
  }

  async function handleCreateModule() {
    if (!newModuleName.trim()) return;
    if (!addForm.applicationId) {
      showToast('Select an application first', 'info');
      return;
    }
    setCreatingModule(true);
    try {
      const mod = await apiCreateModule({
        name: newModuleName.trim(),
        applicationId: addForm.applicationId,
      });
      setModules((prev) => [...prev, mod]);
      setAddForm((f) => ({ ...f, moduleId: mod._id }));
      setNewModuleName(null);
      showToast(`Module "${mod.name}" created`, 'success');
    } catch (e) {
      showToast(e.message || 'Failed to create module', 'error');
    } finally {
      setCreatingModule(false);
    }
  }

  function clearAll() {
    setConfirmDialog({
      open: true,
      message:
        'Delete ALL test cases, applications, modules, and test runs from the database?',
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setPromptDialog({
          open: true,
          value: '',
          onConfirm: async (typed) => {
            setPromptDialog((prev) => ({ ...prev, open: false }));
            if (typed !== CONFIRM_TOKENS.RESET) {
              showToast('Reset cancelled — type RESET exactly', 'info');
              return;
            }
            await Promise.all([
              resetTeamTestCases({ confirm: CONFIRM_TOKENS.RESET }),
              putSettings(
                { testEnvironment: '', softwareVersion: '' },
                { silentFailure: true },
              ),
            ]);
            setCases([]);
            setTotalCount(0);
            setApplications([]);
            setModules([]);
            setBVersion('');
            settingsVersionRef.current = '';
            appsModsLoaded.current = false;
            showToast('All data cleared', 'info');
          },
        });
      },
    });
  }

  async function assignTestCases(e) {
    e.preventDefault();
    if (!assignForm.assignedTo) {
      showToast('Select an assignee', 'info');
      return;
    }
    if (selectedIds.size === 0) {
      showToast('Select test cases first', 'info');
      return;
    }
    setAssignSaving(true);
    try {
      const data = await createAssignment({
        ...assignForm,
        type: 'selection',
        testCaseIds: Array.from(selectedIds),
      });
      showToast(
        `Assigned ${data.testCaseCount} test cases to ${assignForm.assignedTo}`,
        'success',
      );
      setShowAssignModal(false);
      setAssignForm({
        assignedTo: '',
        priority: PRIORITY_DEFAULT,
        dueDate: '',
        notes: '',
        title: '',
      });
      setSelectedIds(new Set());
      fetchPage(page);
    } catch (err) {
      showToast(err.message || 'Assignment failed', 'error');
    } finally {
      setAssignSaving(false);
    }
  }

  const filteredModules = fApp
    ? modules.filter((m) => m.applicationId === fApp)
    : modules;
  const pageIds = cases.map((t) => t._id);
  const selectedOnPage = pageIds.filter((id) => selectedIds.has(id));
  const allPageSelected =
    pageIds.length > 0 && selectedOnPage.length === pageIds.length;
  const somePageSelected = selectedOnPage.length > 0 && !allPageSelected;

  const clearBtn = (onClick) => (
    <IconButton
      size='small'
      onClick={onClick}
      sx={{ color: 'text.disabled', p: 0 }}
    >
      ×
    </IconButton>
  );

  return (
    <Box>
      <ToastProvider />

      {/* Header */}
      <PageHeader
        eyebrow='Data Grid'
        title='Test Cases'
        sub={
          loading ? (
            <Skeleton variant='text' width={80} />
          ) : (
            `${totalCount} rows`
          )
        }
        actions={
          <Stack
            direction='row'
            spacing={1}
            sx={{ flexWrap: 'wrap', alignItems: 'center' }}
          >
            <Button
              variant='contained'
              size='small'
              onClick={() => setShowAddModal(true)}
            >
              + Add Test Case
            </Button>
            {isAdmin && (
              <Button
                variant='outlined'
                color='error'
                size='small'
                onClick={clearAll}
              >
                Clear All Data
              </Button>
            )}
          </Stack>
        }
      />

      {/* Bulk Fill */}
      <Paper variant='outlined' sx={{ mb: 2 }}>
        <Stack
          direction='row'
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2.5,
            py: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Stack direction='row' spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography variant='panelTitle' component='h2'>
              Bulk Fill
            </Typography>
            {selectedIds.size > 0 && (
              <Stack
                direction='row'
                spacing={0.75}
                sx={{ alignItems: 'center' }}
              >
                <Chip
                  label={
                    <Stack
                      direction='row'
                      spacing={0.5}
                      sx={{ alignItems: 'center' }}
                    >
                      <span>{selectedIds.size} selected</span>
                      <IconButton
                        size='small'
                        onClick={() => setSelectedIds(new Set())}
                        sx={{ color: 'inherit', p: 0, opacity: 0.8 }}
                        title='Clear selection'
                      >
                        ×
                      </IconButton>
                    </Stack>
                  }
                  color='primary'
                  size='small'
                />
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() => setShowAssignModal(true)}
                  sx={{ fontSize: 12, py: '3px', px: '10px' }}
                >
                  ◷ Assign
                </Button>
              </Stack>
            )}
          </Stack>
          <IconButton
            size='small'
            title='Clear bulk fill fields'
            sx={{ color: 'text.disabled' }}
            onClick={() => {
              setBStatus('');
              setBFromTester('');
              setBTester('');
              setBDate('');
              setBVersion('');
              setBPriority('');
            }}
          >
            ×
          </IconButton>
        </Stack>
        <Box sx={{ p: 2.5 }}>
          <Grid container spacing={1.25} sx={{ mb: 1.25 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size='small'
                label='Fill Status'
                value={bStatus}
                onChange={(e) => setBStatus(e.target.value)}
              >
                <MenuItem value=''>No change</MenuItem>
                <MenuItem value={STATUS.PASS}>Pass</MenuItem>
                <MenuItem value={STATUS.FAIL}>Fail</MenuItem>
                <MenuItem value={STATUS.PENDING}>Pending</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size='small'
                label={
                  <Stack
                    direction='row'
                    spacing={0.5}
                    sx={{ alignItems: 'center' }}
                  >
                    <span>From Tester</span>
                    <Typography variant='caption' color='text.disabled'>
                      (filter)
                    </Typography>
                  </Stack>
                }
                value={bFromTester}
                onChange={(e) => setBFromTester(e.target.value)}
                sx={
                  bFromTester
                    ? {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      }
                    : {}
                }
              >
                <MenuItem value=''>All visible</MenuItem>
                {qaUsers.map((u) => (
                  <MenuItem key={u} value={u}>
                    {u}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size='small'
                label='→ Reassign To'
                value={bTester}
                onChange={(e) => setBTester(e.target.value)}
              >
                <MenuItem value=''>No change</MenuItem>
                {qaUsers.map((u) => (
                  <MenuItem key={u} value={u}>
                    {u}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size='small'
                label='Priority'
                value={bPriority}
                onChange={(e) => setBPriority(e.target.value)}
                slotProps={{
                  select: {
                    sx: {
                      ...(bPriority === PRIORITIES.HIGH && {
                        color: 'error.main',
                        fontWeight: 600,
                      }),
                      ...(bPriority === PRIORITIES.MEDIUM && {
                        color: 'warning.main',
                        fontWeight: 600,
                      }),
                      ...(bPriority === PRIORITIES.LOW && {
                        color: 'success.main',
                        fontWeight: 600,
                      }),
                    },
                  },
                }}
              >
                <MenuItem value=''>No change</MenuItem>
                <MenuItem value={PRIORITIES.HIGH}>High</MenuItem>
                <MenuItem value={PRIORITIES.MEDIUM}>Medium</MenuItem>
                <MenuItem value={PRIORITIES.LOW}>Low</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          <Grid container spacing={1.25} sx={{ alignItems: 'flex-end' }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size='small'
                label='Fill Date'
                type='date'
                value={bDate}
                onChange={(e) => setBDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size='small'
                label='Fill Version'
                type='text'
                value={bVersion}
                onChange={(e) => handleVersionChange(e.target.value)}
                placeholder='e.g. 2.4.1'
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                variant='outlined'
                fullWidth
                loading={bulkLoading}
                onClick={() => bulkFill(true)}
                color={
                  bStatus === STATUS.PASS
                    ? 'success'
                    : bStatus === STATUS.FAIL
                      ? 'error'
                      : bStatus === STATUS.PENDING
                        ? 'warning'
                        : 'primary'
                }
              >
                {bStatus ? `${bStatus}: Pending Rows` : 'Fill Pending'}
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                variant='contained'
                fullWidth
                loading={bulkLoading}
                onClick={() => bulkFill(false)}
                color={
                  bStatus === STATUS.PASS
                    ? 'success'
                    : bStatus === STATUS.FAIL
                      ? 'error'
                      : bStatus === STATUS.PENDING
                        ? 'warning'
                        : 'primary'
                }
              >
                {selectedIds.size > 0
                  ? `${bStatus || 'Fill'}: Selected (${selectedIds.size})`
                  : bStatus
                    ? `${bStatus}: All Visible`
                    : 'Fill Visible'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Bulk Edit — shown when rows are selected */}
      {selectedIds.size > 0 && (
        <Paper variant='outlined' sx={{ mb: 2, borderColor: 'primary.main' }}>
          <Stack
            direction='row'
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2.5,
              py: 2,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant='panelTitle' component='h2'>
                Bulk Edit
              </Typography>
              <Chip
                label={`${selectedIds.size} selected`}
                color='primary'
                size='small'
              />
            </Stack>
            <IconButton
              size='small'
              title='Clear bulk edit fields'
              sx={{ color: 'text.disabled' }}
              onClick={() => {
                setBePriority('');
                setBeJiraStory('');
                setBeApplication('');
                setBeModule('');
              }}
            >
              ×
            </IconButton>
          </Stack>
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={1.25} sx={{ alignItems: 'flex-end' }}>
              <Grid size={{ xs: 12, md: 'grow' }}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Application'
                  value={beApplication}
                  onChange={(e) => {
                    setBeApplication(e.target.value);
                    setBeModule('');
                  }}
                >
                  <MenuItem value=''>No change</MenuItem>
                  {applications.map((a) => (
                    <MenuItem key={a._id} value={a._id}>
                      {a.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 'grow' }}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Module'
                  value={beModule}
                  onChange={(e) => setBeModule(e.target.value)}
                >
                  <MenuItem value=''>No change</MenuItem>
                  {(beApplication
                    ? modules.filter((m) => m.applicationId === beApplication)
                    : modules
                  ).map((m) => (
                    <MenuItem key={m._id} value={m._id}>
                      {m.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 'grow' }}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Priority'
                  value={bePriority}
                  onChange={(e) => setBePriority(e.target.value)}
                >
                  <MenuItem value=''>No change</MenuItem>
                  <MenuItem value={PRIORITIES.HIGH}>High</MenuItem>
                  <MenuItem value={PRIORITIES.MEDIUM}>Medium</MenuItem>
                  <MenuItem value={PRIORITIES.LOW}>Low</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 'grow' }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Jira Story'
                  type='text'
                  value={beJiraStory}
                  onChange={(e) => setBeJiraStory(e.target.value)}
                  placeholder='e.g. JIRA-123'
                />
              </Grid>
              <Grid size={{ xs: 12, md: 'grow' }}>
                <Button
                  variant='contained'
                  fullWidth
                  loading={bulkEditLoading}
                  onClick={bulkEdit}
                >
                  Apply to {selectedIds.size} rows
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {/* Filters */}
      <Paper variant='outlined' sx={{ mb: 2 }}>
        <Stack
          direction='row'
          sx={{
            alignItems: 'center',
            px: 2.5,
            py: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant='panelTitle' component='h2' sx={{ fontSize: 14 }}>
            Filters
          </Typography>
        </Stack>
        <Box sx={{ p: '14px 20px' }}>
          <Grid container spacing={1.25}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size='small'
                label={
                  <Stack
                    direction='row'
                    sx={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <span>Application</span>
                    {fApp &&
                      clearBtn(() => {
                        setFApp('');
                        setFMod('');
                      })}
                  </Stack>
                }
                value={fApp}
                onChange={(e) => {
                  setFApp(e.target.value);
                  setFMod('');
                }}
              >
                <MenuItem value=''>All</MenuItem>
                {applications.map((a) => (
                  <MenuItem key={a._id} value={a._id}>
                    {a.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size='small'
                label={
                  <Stack
                    direction='row'
                    sx={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <span>Module</span>
                    {fMod && clearBtn(() => setFMod(''))}
                  </Stack>
                }
                value={fMod}
                onChange={(e) => setFMod(e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                {filteredModules.map((m) => (
                  <MenuItem key={m._id} value={m._id}>
                    {m.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size='small'
                label={
                  <Stack
                    direction='row'
                    sx={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <span>Status</span>
                    {fStatus && clearBtn(() => setFStatus(''))}
                  </Stack>
                }
                value={fStatus}
                onChange={(e) => setFStatus(e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value={STATUS.PASS}>Pass</MenuItem>
                <MenuItem value={STATUS.FAIL}>Fail</MenuItem>
                <MenuItem value={STATUS.PENDING}>Pending</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size='small'
                label={
                  <Stack
                    direction='row'
                    sx={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <span>Priority</span>
                    {fPriority && clearBtn(() => setFPriority(''))}
                  </Stack>
                }
                value={fPriority}
                onChange={(e) => setFPriority(e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value={PRIORITIES.HIGH}>High</MenuItem>
                <MenuItem value={PRIORITIES.MEDIUM}>Medium</MenuItem>
                <MenuItem value={PRIORITIES.LOW}>Low</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size='small'
                label={
                  <Stack
                    direction='row'
                    sx={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <span>Tested By</span>
                    {fTester && clearBtn(() => setFTester(''))}
                  </Stack>
                }
                value={fTester}
                onChange={(e) => setFTester(e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value={UNASSIGNED_SENTINEL}>Unassigned</MenuItem>
                {qaUsers.map((u) => (
                  <MenuItem key={u} value={u}>
                    {u}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size='small'
                label={
                  <Stack
                    direction='row'
                    sx={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <span>Assigned To</span>
                    {fAssignedTo && clearBtn(() => setFAssignedTo(''))}
                  </Stack>
                }
                value={fAssignedTo}
                onChange={(e) => setFAssignedTo(e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value={UNASSIGNED_SENTINEL}>Unassigned</MenuItem>
                {qaUsers.map((u) => (
                  <MenuItem key={u} value={u}>
                    {u}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size='small'
                label='Version'
                type='search'
                value={fVersion}
                onChange={(e) => setFVersion(e.target.value)}
                placeholder='Any version'
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size='small'
                label={
                  <Stack
                    direction='row'
                    sx={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <span>Jira Story</span>
                    {fJiraStory && clearBtn(() => setFJiraStory(''))}
                  </Stack>
                }
                type='search'
                value={fJiraStory}
                onChange={(e) => setFJiraStory(e.target.value)}
                placeholder='e.g. JIRA-123'
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Table */}
      <Paper variant='outlined'>
        {!loading && totalCount === 0 ? (
          <EmptyState icon={<SearchOffOutlined />} title='No test cases found'>
            <p>Import an Excel file from the Dashboard to populate the grid.</p>
          </EmptyState>
        ) : (
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
                  <TableCell
                    sx={{ width: 36, textAlign: 'center', px: '6px', py: 1 }}
                  >
                    <input
                      type='checkbox'
                      checked={allPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = somePageSelected;
                      }}
                      onChange={() =>
                        toggleSelectPage(pageIds, allPageSelected)
                      }
                      title={allPageSelected ? 'Deselect page' : 'Select page'}
                      disabled={loading}
                    />
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 40,
                      textAlign: 'center',
                      color: 'text.disabled',
                      fontSize: 12,
                    }}
                  >
                    #
                  </TableCell>
                  {[
                    'Platform',
                    'Module',
                    'Priority',
                    'Type',
                    'Jira Story',
                    'Traceability',
                    'Test Case ID',
                    'Test Case',
                    'Preconditions',
                    'Steps',
                    'Expected Result',
                    'Actual Result',
                    'Status',
                    'Defects',
                    'Tested By',
                    'Tested On',
                    'Version',
                    '',
                  ].map((h) => (
                    <TableCell key={h}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading
                  ? Array.from({ length: 8 }, (_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 20 }, (__, j) => (
                          <TableCell key={j}>
                            <Skeleton variant='text' />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : cases.map((tc, index) => (
                      <TestCaseRow
                        key={tc._id}
                        tc={tc}
                        rowNum={(page - 1) * pageSize + index + 1}
                        saving={!!saving[tc._id]}
                        onSave={saveField}
                        onEdit={openEdit}
                        selected={selectedIds.has(tc._id)}
                        onToggle={() => toggleSelect(tc._id)}
                        qaUsers={qaUsers}
                      />
                    ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {!loading && totalCount > 0 && (
          <TablePagination
            component='div'
            count={totalCount}
            page={page - 1}
            rowsPerPage={pageSize}
            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
            onPageChange={(_, newPage) => goToPage(newPage + 1)}
            onRowsPerPageChange={(e) => setPageSize(Number(e.target.value))}
          />
        )}
      </Paper>

      {/* Add Test Case Modal */}
      <Dialog
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setAddForm(EMPTY_FORM);
          setNewModuleName(null);
        }}
        maxWidth='md'
        fullWidth
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle>Add Test Case</DialogTitle>
        <DialogContent dividers>
          <form onSubmit={addTestCase}>
            <Grid container spacing={1.75} sx={{ mb: 1.75 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Application *'
                  required
                  value={addForm.applicationId}
                  onChange={(e) =>
                    setAddForm((f) => ({
                      ...f,
                      applicationId: e.target.value,
                      moduleId: '',
                    }))
                  }
                >
                  <MenuItem value=''>Select application</MenuItem>
                  {applications.map((a) => (
                    <MenuItem key={a._id} value={a._id}>
                      {a.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Module *'
                  required
                  value={addForm.moduleId}
                  onChange={(e) => {
                    if (e.target.value === '__new__') {
                      setAddForm((f) => ({ ...f, moduleId: '' }));
                      setNewModuleName('');
                      setTimeout(() => newModuleInputRef.current?.focus(), 50);
                    } else {
                      setAddForm((f) => ({ ...f, moduleId: e.target.value }));
                      setNewModuleName(null);
                    }
                  }}
                >
                  <MenuItem value=''>Select module</MenuItem>
                  <MenuItem value='__new__'>+ Add new module…</MenuItem>
                  {modules
                    .filter(
                      (m) =>
                        !addForm.applicationId ||
                        m.applicationId === addForm.applicationId,
                    )
                    .map((m) => (
                      <MenuItem key={m._id} value={m._id}>
                        {m.name}
                      </MenuItem>
                    ))}
                </TextField>
                {newModuleName !== null && (
                  <Stack direction='row' spacing={0.75} sx={{ mt: 0.75 }}>
                    <TextField
                      inputRef={newModuleInputRef}
                      size='small'
                      value={newModuleName}
                      onChange={(e) => setNewModuleName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateModule();
                        }
                      }}
                      placeholder='New module name'
                      sx={{ flex: 1 }}
                    />
                    <Button
                      variant='contained'
                      size='small'
                      onClick={handleCreateModule}
                      disabled={creatingModule || !newModuleName.trim()}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {creatingModule ? '…' : 'Create'}
                    </Button>
                    <Button
                      variant='outlined'
                      size='small'
                      onClick={() => setNewModuleName(null)}
                      sx={{ px: 1 }}
                    >
                      ×
                    </Button>
                  </Stack>
                )}
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Test Case ID'
                  value={addForm.testCaseId}
                  placeholder='e.g. TC-001'
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, testCaseId: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Type'
                  value={addForm.type}
                  placeholder='e.g. Functional'
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, type: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Priority'
                  value={addForm.priority}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, priority: e.target.value }))
                  }
                >
                  <MenuItem value=''>—</MenuItem>
                  <MenuItem value={PRIORITIES.HIGH}>High</MenuItem>
                  <MenuItem value={PRIORITIES.MEDIUM}>Medium</MenuItem>
                  <MenuItem value={PRIORITIES.LOW}>Low</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Jira Story'
                  value={addForm.jiraStory}
                  placeholder='e.g. JIRA-123'
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, jiraStory: e.target.value }))
                  }
                />
              </Grid>
            </Grid>
            <Box sx={{ mb: 1.75 }}>
              <TextField
                fullWidth
                size='small'
                label='Test Case *'
                required
                multiline
                rows={2}
                value={addForm.testCase}
                placeholder='Describe the test case'
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, testCase: e.target.value }))
                }
              />
            </Box>
            <Grid container spacing={1.75} sx={{ mb: 1.75 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  Preconditions
                </Typography>
                <RichTextEditor
                  value={addForm.preconditions}
                  onChange={(v) =>
                    setAddForm((f) => ({ ...f, preconditions: v }))
                  }
                  placeholder='List any preconditions…'
                  minHeight={72}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  Steps
                </Typography>
                <RichTextEditor
                  value={addForm.steps}
                  onChange={(v) => setAddForm((f) => ({ ...f, steps: v }))}
                  placeholder='1. Step one&#10;2. Step two…'
                  minHeight={72}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  Expected Result *
                </Typography>
                <RichTextEditor
                  value={addForm.expectedResult}
                  onChange={(v) =>
                    setAddForm((f) => ({ ...f, expectedResult: v }))
                  }
                  placeholder='Describe the expected outcome…'
                  minHeight={72}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  Actual Result
                </Typography>
                <RichTextEditor
                  value={addForm.actualResult}
                  onChange={(v) =>
                    setAddForm((f) => ({ ...f, actualResult: v }))
                  }
                  placeholder='Describe the actual outcome…'
                  minHeight={72}
                />
              </Grid>
            </Grid>
            <Grid container spacing={1.75} sx={{ mb: 2.5 }}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Status'
                  value={addForm.status}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  <MenuItem value=''>Pending</MenuItem>
                  <MenuItem value={STATUS.PASS}>Pass</MenuItem>
                  <MenuItem value={STATUS.FAIL}>Fail</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Tested By'
                  value={addForm.testedBy}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, testedBy: e.target.value }))
                  }
                >
                  <MenuItem value=''>—</MenuItem>
                  {qaUsers.map((u) => (
                    <MenuItem key={u} value={u}>
                      {u}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Tested On'
                  type='date'
                  value={addForm.testedOn}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, testedOn: e.target.value }))
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Version'
                  value={addForm.softwareVersionTested}
                  placeholder={bVersion || ''}
                  onChange={(e) =>
                    setAddForm((f) => ({
                      ...f,
                      softwareVersionTested: e.target.value,
                    }))
                  }
                />
              </Grid>
            </Grid>
            <Stack
              direction='row'
              spacing={1.25}
              sx={{ justifyContent: 'flex-end' }}
            >
              <Button
                variant='outlined'
                onClick={() => {
                  setShowAddModal(false);
                  setAddForm(EMPTY_FORM);
                  setNewModuleName(null);
                }}
              >
                Cancel
              </Button>
              <Button type='submit' variant='contained' loading={addSaving}>
                Add Test Case
              </Button>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Test Case Modal */}
      <Dialog
        open={!!editTc}
        onClose={() => setEditTc(null)}
        maxWidth='md'
        fullWidth
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle>
          {editTc?.testCaseId && (
            <Typography
              variant='metricSub'
              sx={{ display: 'block', color: 'text.disabled', fontWeight: 400 }}
            >
              {editTc.testCaseId}
            </Typography>
          )}
          Edit Test Case
        </DialogTitle>
        <DialogContent dividers>
          <form onSubmit={saveEdit}>
            {/* Application, Module, Priority, Jira Story */}
            <Grid container spacing={1.75} sx={{ mb: 1.75 }}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Application'
                  value={editForm.applicationId}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      applicationId: e.target.value,
                      moduleId: '',
                    }))
                  }
                >
                  <MenuItem value=''>—</MenuItem>
                  {applications.map((a) => (
                    <MenuItem key={a._id} value={a._id}>
                      {a.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Module'
                  value={editForm.moduleId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, moduleId: e.target.value }))
                  }
                >
                  <MenuItem value=''>—</MenuItem>
                  {modules
                    .filter(
                      (m) =>
                        !editForm.applicationId ||
                        m.applicationId === editForm.applicationId,
                    )
                    .map((m) => (
                      <MenuItem key={m._id} value={m._id}>
                        {m.name}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Priority'
                  value={editForm.priority || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, priority: e.target.value }))
                  }
                >
                  <MenuItem value=''>—</MenuItem>
                  <MenuItem value={PRIORITIES.HIGH}>High</MenuItem>
                  <MenuItem value={PRIORITIES.MEDIUM}>Medium</MenuItem>
                  <MenuItem value={PRIORITIES.LOW}>Low</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Jira Story'
                  value={editForm.jiraStory || ''}
                  placeholder='e.g. JIRA-123'
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, jiraStory: e.target.value }))
                  }
                />
              </Grid>
            </Grid>
            {/* ID, Type, Traceability */}
            <Grid container spacing={1.75} sx={{ mb: 1.75 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Test Case ID'
                  value={editForm.testCaseId || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, testCaseId: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Type'
                  value={editForm.type || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, type: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Traceability'
                  value={editForm.traceability || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, traceability: e.target.value }))
                  }
                />
              </Grid>
            </Grid>
            {/* Test Case */}
            <Box sx={{ mb: 1.75 }}>
              <TextField
                fullWidth
                size='small'
                label='Test Case'
                multiline
                rows={2}
                value={editForm.testCase || ''}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, testCase: e.target.value }))
                }
              />
            </Box>
            {/* Preconditions, Steps */}
            <Grid container spacing={1.75} sx={{ mb: 1.75 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  Preconditions
                </Typography>
                <RichTextEditor
                  value={editForm.preconditions || ''}
                  onChange={(v) =>
                    setEditForm((f) => ({ ...f, preconditions: v }))
                  }
                  placeholder='List any preconditions…'
                  minHeight={80}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  Steps
                </Typography>
                <RichTextEditor
                  value={editForm.steps || ''}
                  onChange={(v) => setEditForm((f) => ({ ...f, steps: v }))}
                  placeholder='1. Navigate to…'
                  minHeight={80}
                />
              </Grid>
            </Grid>
            {/* Expected, Actual */}
            <Grid container spacing={1.75} sx={{ mb: 1.75 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  Expected Result
                </Typography>
                <RichTextEditor
                  value={editForm.expectedResult || ''}
                  onChange={(v) =>
                    setEditForm((f) => ({ ...f, expectedResult: v }))
                  }
                  placeholder='Describe the expected outcome…'
                  minHeight={80}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  Actual Result
                </Typography>
                <RichTextEditor
                  value={editForm.actualResult || ''}
                  onChange={(v) =>
                    setEditForm((f) => ({ ...f, actualResult: v }))
                  }
                  placeholder='Describe the actual outcome…'
                  minHeight={80}
                />
              </Grid>
            </Grid>
            {/* Defects */}
            <Box sx={{ mb: 1.75 }}>
              <TextField
                fullWidth
                size='small'
                label='Defects / Improvements'
                value={editForm.defectsImprovements || ''}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    defectsImprovements: e.target.value,
                  }))
                }
              />
            </Box>
            {/* Status, Tested By, Tested On, Version */}
            <Grid container spacing={1.75} sx={{ mb: 2.5 }}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Status'
                  value={editForm.status || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  <MenuItem value=''>Pending</MenuItem>
                  <MenuItem value={STATUS.PASS}>Pass</MenuItem>
                  <MenuItem value={STATUS.FAIL}>Fail</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Tested By'
                  value={editForm.testedBy || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, testedBy: e.target.value }))
                  }
                >
                  <MenuItem value=''>—</MenuItem>
                  {qaUsers.map((u) => (
                    <MenuItem key={u} value={u}>
                      {u}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Tested On'
                  type='date'
                  value={toDateInputValue(editForm.testedOn || '')}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, testedOn: e.target.value }))
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Version'
                  value={editForm.softwareVersionTested || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      softwareVersionTested: e.target.value,
                    }))
                  }
                />
              </Grid>
            </Grid>
            <Stack
              direction='row'
              spacing={1.25}
              sx={{ justifyContent: 'flex-end' }}
            >
              <Button variant='outlined' onClick={() => setEditTc(null)}>
                Cancel
              </Button>
              <Button type='submit' variant='contained' loading={editSaving}>
                Save Changes
              </Button>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        maxWidth='xs'
      >
        <DialogTitle>Confirm</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setConfirmDialog((prev) => ({ ...prev, open: false }))
            }
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={confirmDialog.onConfirm}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Prompt Dialog */}
      <Dialog
        open={promptDialog.open}
        onClose={() => setPromptDialog((prev) => ({ ...prev, open: false }))}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Clear All Data</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size='small'
            label='Type RESET to confirm'
            value={promptDialog.value}
            onChange={(e) =>
              setPromptDialog((prev) => ({ ...prev, value: e.target.value }))
            }
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setPromptDialog((prev) => ({ ...prev, open: false }))
            }
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={() => promptDialog.onConfirm(promptDialog.value)}
          >
            Clear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Selected Modal */}
      <Dialog
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>
          Assign {selectedIds.size} Test Case{selectedIds.size !== 1 ? 's' : ''}
        </DialogTitle>
        <DialogContent dividers>
          <form onSubmit={assignTestCases} style={{ display: 'grid', gap: 14 }}>
            <TextField
              fullWidth
              size='small'
              label={
                <Stack
                  direction='row'
                  spacing={0.5}
                  sx={{ alignItems: 'center' }}
                >
                  <span>Title</span>
                  <Typography variant='caption' color='text.disabled'>
                    (optional)
                  </Typography>
                </Stack>
              }
              type='text'
              value={assignForm.title}
              onChange={(e) =>
                setAssignForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder='e.g. Login flow — sprint 12'
            />
            <TextField
              select
              fullWidth
              size='small'
              label='Assign to'
              value={assignForm.assignedTo}
              onChange={(e) =>
                setAssignForm((f) => ({ ...f, assignedTo: e.target.value }))
              }
              required
            >
              <MenuItem value=''>Select team member…</MenuItem>
              {qaUsers.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </TextField>
            <Grid container spacing={1.5}>
              <Grid size={6}>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Priority'
                  value={assignForm.priority}
                  onChange={(e) =>
                    setAssignForm((f) => ({ ...f, priority: e.target.value }))
                  }
                >
                  <MenuItem value={PRIORITIES.HIGH}>High</MenuItem>
                  <MenuItem value={PRIORITIES.MEDIUM}>Medium</MenuItem>
                  <MenuItem value={PRIORITIES.LOW}>Low</MenuItem>
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  size='small'
                  label='Due date'
                  type='date'
                  value={assignForm.dueDate}
                  onChange={(e) =>
                    setAssignForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              size='small'
              label='Notes'
              multiline
              rows={2}
              value={assignForm.notes}
              onChange={(e) =>
                setAssignForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder='Optional context or instructions…'
            />
            <Stack
              direction='row'
              spacing={1.25}
              sx={{ justifyContent: 'flex-end' }}
            >
              <Button
                variant='outlined'
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                variant='contained'
                loading={assignSaving}
                disabled={!assignForm.assignedTo}
              >
                Assign to {assignForm.assignedTo || '…'}
              </Button>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default function TestCasesClient({ user }) {
  return (
    <Suspense>
      <TestCasesPage user={user} />
    </Suspense>
  );
}
