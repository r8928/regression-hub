'use client';

import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
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
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

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

const PAGE_SIZE = 50;

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

  const versionSaveTimer = useRef(null);
  const settingsVersionRef = useRef('');
  const appsModsLoaded = useRef(false);

  const searchParams = useSearchParams();
  useEffect(() => {
    const assignedTo = searchParams.get('assignedTo');
    if (assignedTo) setFAssignedTo(assignedTo);
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
        params.set('limit', PAGE_SIZE);

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

  async function clearAll() {
    if (
      !confirm(
        'Delete ALL test cases, applications, modules, and test runs from the database?',
      )
    )
      return;
    const typed = window.prompt(
      'Type RESET to confirm permanent deletion of all team data:',
    );
    if (typed !== CONFIRM_TOKENS.RESET) {
      if (typed != null)
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
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageIds = cases.map((t) => t._id);
  const selectedOnPage = pageIds.filter((id) => selectedIds.has(id));
  const allPageSelected =
    pageIds.length > 0 && selectedOnPage.length === pageIds.length;
  const somePageSelected = selectedOnPage.length > 0 && !allPageSelected;

  const clearBtn = (onClick) => (
    <button
      onClick={onClick}
      title='Clear'
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--muted)',
        fontSize: 14,
        padding: 0,
        lineHeight: 1,
      }}
    >
      ×
    </button>
  );

  return (
    <div>
      <ToastProvider />

      {/* Header */}
      <PageHeader
        eyebrow='Data Grid'
        title='Test Cases'
        sub={loading ? 'Loading…' : `${totalCount} rows`}
        actions={
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <button
              className='btn btn-primary btn-sm'
              onClick={() => setShowAddModal(true)}
            >
              + Add Test Case
            </button>
            {isAdmin && (
              <button className='btn btn-danger btn-sm' onClick={clearAll}>
                Clear All Data
              </button>
            )}
          </div>
        }
      />

      {/* Bulk Fill */}
      <div className='panel' style={{ marginBottom: 16 }}>
        <div
          className='panel-header'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h3 style={{ margin: 0 }}>Bulk Fill</h3>
            {selectedIds.size > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: 12,
                    background: 'var(--accent)',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '2px 10px',
                    fontWeight: 600,
                  }}
                >
                  {selectedIds.size} selected
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#fff',
                      fontSize: 13,
                      marginLeft: 6,
                      padding: 0,
                      lineHeight: 1,
                      opacity: 0.8,
                    }}
                    title='Clear selection'
                  >
                    ×
                  </button>
                </span>
                <button
                  className='btn btn-secondary btn-sm'
                  onClick={() => setShowAssignModal(true)}
                  style={{ fontSize: 12, padding: '3px 10px' }}
                >
                  ◷ Assign
                </button>
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setBStatus('');
              setBFromTester('');
              setBTester('');
              setBDate('');
              setBVersion('');
              setBPriority('');
            }}
            title='Clear bulk fill fields'
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontSize: 18,
              lineHeight: 1,
              padding: '0 4px',
            }}
          >
            ×
          </button>
        </div>
        <div className='panel-body'>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div className='field-group'>
              <label className='field-label'>Fill Status</label>
              <select
                className='field-select'
                value={bStatus}
                onChange={(e) => setBStatus(e.target.value)}
              >
                <option value=''>No change</option>
                <option value={STATUS.PASS}>Pass</option>
                <option value={STATUS.FAIL}>Fail</option>
                <option value={STATUS.PENDING}>Pending</option>
              </select>
            </div>
            <div className='field-group'>
              <label
                className='field-label'
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                From Tester
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--muted)',
                    fontWeight: 400,
                  }}
                >
                  (filter)
                </span>
              </label>
              <select
                className='field-select'
                value={bFromTester}
                onChange={(e) => setBFromTester(e.target.value)}
                style={{
                  borderColor: bFromTester ? 'var(--accent)' : undefined,
                }}
              >
                <option value=''>All visible</option>
                {qaUsers.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className='field-group'>
              <label className='field-label'>→ Reassign To</label>
              <select
                className='field-select'
                value={bTester}
                onChange={(e) => setBTester(e.target.value)}
              >
                <option value=''>No change</option>
                {qaUsers.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className='field-group'>
              <label className='field-label'>Priority</label>
              <select
                className='field-select'
                value={bPriority}
                onChange={(e) => setBPriority(e.target.value)}
                style={{
                  ...(bPriority === PRIORITIES.HIGH && {
                    borderColor: '#dc2626',
                    color: '#dc2626',
                    fontWeight: 600,
                  }),
                  ...(bPriority === PRIORITIES.MEDIUM && {
                    borderColor: '#d97706',
                    color: '#d97706',
                    fontWeight: 600,
                  }),
                  ...(bPriority === PRIORITIES.LOW && {
                    borderColor: '#16a34a',
                    color: '#16a34a',
                    fontWeight: 600,
                  }),
                }}
              >
                <option value=''>No change</option>
                <option value={PRIORITIES.HIGH}>High</option>
                <option value={PRIORITIES.MEDIUM}>Medium</option>
                <option value={PRIORITIES.LOW}>Low</option>
              </select>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 10,
              alignItems: 'end',
            }}
          >
            <div className='field-group'>
              <label className='field-label'>Fill Date</label>
              <input
                className='field-input'
                type='date'
                value={bDate}
                onChange={(e) => setBDate(e.target.value)}
              />
            </div>
            <div className='field-group'>
              <label className='field-label'>Fill Version</label>
              <input
                className='field-input'
                type='text'
                value={bVersion}
                onChange={(e) => handleVersionChange(e.target.value)}
                placeholder='e.g. 2.4.1'
              />
            </div>
            <button
              className='btn btn-secondary'
              onClick={() => bulkFill(true)}
              disabled={bulkLoading}
              style={{
                ...(bStatus === STATUS.PASS && {
                  background: '#16a34a',
                  borderColor: '#16a34a',
                  color: '#fff',
                }),
                ...(bStatus === STATUS.FAIL && {
                  background: '#dc2626',
                  borderColor: '#dc2626',
                  color: '#fff',
                }),
                ...(bStatus === STATUS.PENDING && {
                  background: '#d97706',
                  borderColor: '#d97706',
                  color: '#fff',
                }),
              }}
            >
              {bStatus ? `${bStatus}: Pending Rows` : 'Fill Pending'}
            </button>
            <button
              className='btn btn-primary'
              onClick={() => bulkFill(false)}
              disabled={bulkLoading}
              style={{
                ...(bStatus === STATUS.PASS && {
                  background: '#16a34a',
                  borderColor: '#16a34a',
                }),
                ...(bStatus === STATUS.FAIL && {
                  background: '#dc2626',
                  borderColor: '#dc2626',
                }),
                ...(bStatus === STATUS.PENDING && {
                  background: '#d97706',
                  borderColor: '#d97706',
                }),
              }}
            >
              {selectedIds.size > 0
                ? `${bStatus || 'Fill'}: Selected (${selectedIds.size})`
                : bStatus
                  ? `${bStatus}: All Visible`
                  : 'Fill Visible'}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Edit — shown when rows are selected */}
      {selectedIds.size > 0 && (
        <div
          className='panel'
          style={{
            marginBottom: 16,
            borderColor: 'var(--accent)',
            borderWidth: 1,
            borderStyle: 'solid',
          }}
        >
          <div
            className='panel-header'
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3 style={{ margin: 0 }}>
              Bulk Edit
              <span
                style={{
                  fontSize: 12,
                  background: 'var(--accent)',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '2px 9px',
                  fontWeight: 600,
                  marginLeft: 10,
                }}
              >
                {selectedIds.size} selected
              </span>
            </h3>
            <button
              onClick={() => {
                setBePriority('');
                setBeJiraStory('');
                setBeApplication('');
                setBeModule('');
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted)',
                fontSize: 18,
                lineHeight: 1,
                padding: '0 4px',
              }}
              title='Clear bulk edit fields'
            >
              ×
            </button>
          </div>
          <div className='panel-body'>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 10,
                alignItems: 'end',
              }}
            >
              <div className='field-group'>
                <label className='field-label'>Application</label>
                <select
                  className='field-select'
                  value={beApplication}
                  onChange={(e) => {
                    setBeApplication(e.target.value);
                    setBeModule('');
                  }}
                >
                  <option value=''>No change</option>
                  {applications.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className='field-group'>
                <label className='field-label'>Module</label>
                <select
                  className='field-select'
                  value={beModule}
                  onChange={(e) => setBeModule(e.target.value)}
                >
                  <option value=''>No change</option>
                  {(beApplication
                    ? modules.filter((m) => m.applicationId === beApplication)
                    : modules
                  ).map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className='field-group'>
                <label className='field-label'>Priority</label>
                <select
                  className='field-select'
                  value={bePriority}
                  onChange={(e) => setBePriority(e.target.value)}
                >
                  <option value=''>No change</option>
                  <option value={PRIORITIES.HIGH}>High</option>
                  <option value={PRIORITIES.MEDIUM}>Medium</option>
                  <option value={PRIORITIES.LOW}>Low</option>
                </select>
              </div>
              <div className='field-group'>
                <label className='field-label'>Jira Story</label>
                <input
                  className='field-input'
                  type='text'
                  value={beJiraStory}
                  onChange={(e) => setBeJiraStory(e.target.value)}
                  placeholder='e.g. JIRA-123'
                />
              </div>
              <div>
                <button
                  className='btn btn-primary'
                  style={{ width: '100%' }}
                  onClick={bulkEdit}
                  disabled={bulkEditLoading}
                >
                  {bulkEditLoading
                    ? 'Saving…'
                    : `Apply to ${selectedIds.size} rows`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className='panel' style={{ marginBottom: 16 }}>
        <div
          className='panel-header'
          style={{ paddingTop: 12, paddingBottom: 12 }}
        >
          <h3 style={{ margin: 0, fontSize: 14 }}>Filters</h3>
        </div>
        <div className='panel-body' style={{ padding: '14px 20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 10,
            }}
          >
            <div className='field-group'>
              <label
                className='field-label'
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                Application
                {fApp &&
                  clearBtn(() => {
                    setFApp('');
                    setFMod('');
                  })}
              </label>
              <select
                className='field-select'
                value={fApp}
                onChange={(e) => {
                  setFApp(e.target.value);
                  setFMod('');
                }}
              >
                <option value=''>All</option>
                {applications.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='field-group'>
              <label
                className='field-label'
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                Module
                {fMod && clearBtn(() => setFMod(''))}
              </label>
              <select
                className='field-select'
                value={fMod}
                onChange={(e) => setFMod(e.target.value)}
              >
                <option value=''>All</option>
                {filteredModules.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='field-group'>
              <label
                className='field-label'
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                Status
                {fStatus && clearBtn(() => setFStatus(''))}
              </label>
              <select
                className='field-select'
                value={fStatus}
                onChange={(e) => setFStatus(e.target.value)}
              >
                <option value=''>All</option>
                <option value={STATUS.PASS}>Pass</option>
                <option value={STATUS.FAIL}>Fail</option>
                <option value={STATUS.PENDING}>Pending</option>
              </select>
            </div>
            <div className='field-group'>
              <label
                className='field-label'
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                Priority
                {fPriority && clearBtn(() => setFPriority(''))}
              </label>
              <select
                className='field-select'
                value={fPriority}
                onChange={(e) => setFPriority(e.target.value)}
              >
                <option value=''>All</option>
                <option value={PRIORITIES.HIGH}>High</option>
                <option value={PRIORITIES.MEDIUM}>Medium</option>
                <option value={PRIORITIES.LOW}>Low</option>
              </select>
            </div>
            <div className='field-group'>
              <label
                className='field-label'
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                Tested By
                {fTester && clearBtn(() => setFTester(''))}
              </label>
              <select
                className='field-select'
                value={fTester}
                onChange={(e) => setFTester(e.target.value)}
              >
                <option value=''>All</option>
                <option value={UNASSIGNED_SENTINEL}>Unassigned</option>
                {qaUsers.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className='field-group'>
              <label
                className='field-label'
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                Assigned To
                {fAssignedTo && clearBtn(() => setFAssignedTo(''))}
              </label>
              <select
                className='field-select'
                value={fAssignedTo}
                onChange={(e) => setFAssignedTo(e.target.value)}
              >
                <option value=''>All</option>
                <option value={UNASSIGNED_SENTINEL}>Unassigned</option>
                {qaUsers.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className='field-group'>
              <label className='field-label'>Version</label>
              <input
                className='field-input'
                type='search'
                value={fVersion}
                onChange={(e) => setFVersion(e.target.value)}
                placeholder='Any version'
              />
            </div>
            <div className='field-group'>
              <label
                className='field-label'
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                Jira Story
                {fJiraStory && clearBtn(() => setFJiraStory(''))}
              </label>
              <input
                className='field-input'
                type='search'
                value={fJiraStory}
                onChange={(e) => setFJiraStory(e.target.value)}
                placeholder='e.g. JIRA-123'
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className='panel'>
        <div className='table-wrap'>
          {loading ? (
            <EmptyState>Loading test cases…</EmptyState>
          ) : totalCount === 0 ? (
            <EmptyState icon='◎' title='No test cases found'>
              <p>
                Import an Excel file from the Dashboard to populate the grid.
              </p>
            </EmptyState>
          ) : (
            <table>
              <thead>
                <tr>
                  <th
                    style={{
                      width: 36,
                      textAlign: 'center',
                      padding: '8px 6px',
                    }}
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
                    />
                  </th>
                  <th
                    style={{
                      width: 40,
                      textAlign: 'center',
                      color: 'var(--muted)',
                      fontSize: 12,
                    }}
                  >
                    #
                  </th>
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
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cases.map((tc, index) => (
                  <TestCaseRow
                    key={tc._id}
                    tc={tc}
                    rowNum={(page - 1) * PAGE_SIZE + index + 1}
                    saving={!!saving[tc._id]}
                    onSave={saveField}
                    onEdit={openEdit}
                    selected={selectedIds.has(tc._id)}
                    onToggle={() => toggleSelect(tc._id)}
                    qaUsers={qaUsers}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && totalCount > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderTop: '1px solid var(--line)',
              fontSize: 13,
              color: 'var(--muted)',
            }}
          >
            <span>
              Rows {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                className='btn btn-secondary btn-sm'
                onClick={() => goToPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                ← Prev
              </button>
              <span style={{ padding: '0 8px' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className='btn btn-secondary btn-sm'
                onClick={() => goToPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Test Case Modal */}
      {showAddModal && (
        <Modal
          title='Add Test Case'
          onClose={() => {
            setShowAddModal(false);
            setAddForm(EMPTY_FORM);
            setNewModuleName(null);
          }}
          maxWidth={720}
          cardStyle={{ maxHeight: '90vh', overflow: 'auto' }}
        >
          <form onSubmit={addTestCase}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div className='field-group'>
                <label className='field-label'>Application *</label>
                <select
                  className='field-select'
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
                  <option value=''>Select application</option>
                  {applications.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className='field-group'>
                <label className='field-label'>Module *</label>
                <select
                  className='field-select'
                  required
                  value={addForm.moduleId}
                  onChange={(e) => {
                    if (e.target.value === '__new__') {
                      setAddForm((f) => ({ ...f, moduleId: '' }));
                      setNewModuleName('');
                      setTimeout(
                        () =>
                          document.getElementById('new-module-input')?.focus(),
                        50,
                      );
                    } else {
                      setAddForm((f) => ({ ...f, moduleId: e.target.value }));
                      setNewModuleName(null);
                    }
                  }}
                >
                  <option value=''>Select module</option>
                  <option value='__new__'>+ Add new module…</option>
                  {modules
                    .filter(
                      (m) =>
                        !addForm.applicationId ||
                        m.applicationId === addForm.applicationId,
                    )
                    .map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                </select>
                {newModuleName !== null && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <input
                      id='new-module-input'
                      className='field-input'
                      value={newModuleName}
                      onChange={(e) => setNewModuleName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateModule();
                        }
                      }}
                      placeholder='New module name'
                      style={{ flex: 1 }}
                    />
                    <button
                      type='button'
                      className='btn btn-primary btn-sm'
                      onClick={handleCreateModule}
                      disabled={creatingModule || !newModuleName.trim()}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {creatingModule ? '…' : 'Create'}
                    </button>
                    <button
                      type='button'
                      className='btn btn-secondary btn-sm'
                      onClick={() => setNewModuleName(null)}
                      style={{ padding: '0 8px' }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              <div className='field-group'>
                <label className='field-label'>Test Case ID</label>
                <input
                  className='field-input'
                  value={addForm.testCaseId}
                  placeholder='e.g. TC-001'
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, testCaseId: e.target.value }))
                  }
                />
              </div>
              <div className='field-group'>
                <label className='field-label'>Type</label>
                <input
                  className='field-input'
                  value={addForm.type}
                  placeholder='e.g. Functional'
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, type: e.target.value }))
                  }
                />
              </div>
              <div className='field-group'>
                <label className='field-label'>Priority</label>
                <select
                  className='field-select'
                  value={addForm.priority}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, priority: e.target.value }))
                  }
                >
                  <option value=''>—</option>
                  <option value={PRIORITIES.HIGH}>High</option>
                  <option value={PRIORITIES.MEDIUM}>Medium</option>
                  <option value={PRIORITIES.LOW}>Low</option>
                </select>
              </div>
              <div className='field-group'>
                <label className='field-label'>Jira Story</label>
                <input
                  className='field-input'
                  value={addForm.jiraStory}
                  placeholder='e.g. JIRA-123'
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, jiraStory: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className='field-group' style={{ marginBottom: 14 }}>
              <label className='field-label'>Test Case *</label>
              <textarea
                className='field-input'
                required
                rows={2}
                value={addForm.testCase}
                placeholder='Describe the test case'
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, testCase: e.target.value }))
                }
                style={{ resize: 'vertical' }}
              />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div className='field-group'>
                <label className='field-label'>Preconditions</label>
                <RichTextEditor
                  value={addForm.preconditions}
                  onChange={(v) =>
                    setAddForm((f) => ({ ...f, preconditions: v }))
                  }
                  placeholder='List any preconditions…'
                  minHeight={72}
                />
              </div>
              <div className='field-group'>
                <label className='field-label'>Steps</label>
                <RichTextEditor
                  value={addForm.steps}
                  onChange={(v) => setAddForm((f) => ({ ...f, steps: v }))}
                  placeholder='1. Step one&#10;2. Step two…'
                  minHeight={72}
                />
              </div>
              <div className='field-group'>
                <label className='field-label'>Expected Result *</label>
                <RichTextEditor
                  value={addForm.expectedResult}
                  onChange={(v) =>
                    setAddForm((f) => ({ ...f, expectedResult: v }))
                  }
                  placeholder='Describe the expected outcome…'
                  minHeight={72}
                />
              </div>
              <div className='field-group'>
                <label className='field-label'>Actual Result</label>
                <RichTextEditor
                  value={addForm.actualResult}
                  onChange={(v) =>
                    setAddForm((f) => ({ ...f, actualResult: v }))
                  }
                  placeholder='Describe the actual outcome…'
                  minHeight={72}
                />
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 14,
                marginBottom: 20,
              }}
            >
              <div className='field-group'>
                <label className='field-label'>Status</label>
                <select
                  className='field-select'
                  value={addForm.status}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  <option value=''>Pending</option>
                  <option value={STATUS.PASS}>Pass</option>
                  <option value={STATUS.FAIL}>Fail</option>
                </select>
              </div>
              <div className='field-group'>
                <label className='field-label'>Tested By</label>
                <select
                  className='field-select'
                  value={addForm.testedBy}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, testedBy: e.target.value }))
                  }
                >
                  <option value=''>—</option>
                  {qaUsers.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div className='field-group'>
                <label className='field-label'>Tested On</label>
                <input
                  className='field-input'
                  type='date'
                  value={addForm.testedOn}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, testedOn: e.target.value }))
                  }
                />
              </div>
              <div className='field-group'>
                <label className='field-label'>Version</label>
                <input
                  className='field-input'
                  value={addForm.softwareVersionTested}
                  placeholder={bVersion || ''}
                  onChange={(e) =>
                    setAddForm((f) => ({
                      ...f,
                      softwareVersionTested: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div
              style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}
            >
              <button
                type='button'
                className='btn btn-secondary'
                onClick={() => {
                  setShowAddModal(false);
                  setAddForm(EMPTY_FORM);
                  setNewModuleName(null);
                }}
              >
                Cancel
              </button>
              <button
                type='submit'
                className='btn btn-primary'
                disabled={addSaving}
              >
                {addSaving ? 'Saving…' : 'Add Test Case'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Test Case Modal */}
      {editTc && (
        <Modal
          title={
            <>
              {editTc.testCaseId && (
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--muted)',
                    display: 'block',
                    fontWeight: 400,
                  }}
                >
                  {editTc.testCaseId}
                </span>
              )}
              Edit Test Case
            </>
          }
          onClose={() => setEditTc(null)}
          maxWidth={800}
          cardStyle={{ maxHeight: '90vh', overflow: 'auto' }}
        >
          <form onSubmit={saveEdit}>
            {/* Application, Module, Priority, Jira Story */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div className='field-group'>
                <label className='field-label'>Application</label>
                <select
                  className='field-select'
                  value={editForm.applicationId}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      applicationId: e.target.value,
                      moduleId: '',
                    }))
                  }
                >
                  <option value=''>—</option>
                  {applications.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className='field-group'>
                <label className='field-label'>Module</label>
                <select
                  className='field-select'
                  value={editForm.moduleId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, moduleId: e.target.value }))
                  }
                >
                  <option value=''>—</option>
                  {modules
                    .filter(
                      (m) =>
                        !editForm.applicationId ||
                        m.applicationId === editForm.applicationId,
                    )
                    .map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className='field-group'>
                <label className='field-label'>Priority</label>
                <select
                  className='field-select'
                  value={editForm.priority || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, priority: e.target.value }))
                  }
                >
                  <option value=''>—</option>
                  <option value={PRIORITIES.HIGH}>High</option>
                  <option value={PRIORITIES.MEDIUM}>Medium</option>
                  <option value={PRIORITIES.LOW}>Low</option>
                </select>
              </div>
              <div className='field-group'>
                <label className='field-label'>Jira Story</label>
                <input
                  className='field-input'
                  value={editForm.jiraStory || ''}
                  placeholder='e.g. JIRA-123'
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, jiraStory: e.target.value }))
                  }
                />
              </div>
            </div>
            {/* ID, Type, Traceability */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div className='field-group'>
                <label className='field-label'>Test Case ID</label>
                <input
                  className='field-input'
                  value={editForm.testCaseId || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, testCaseId: e.target.value }))
                  }
                />
              </div>
              <div className='field-group'>
                <label className='field-label'>Type</label>
                <input
                  className='field-input'
                  value={editForm.type || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, type: e.target.value }))
                  }
                />
              </div>
              <div className='field-group'>
                <label className='field-label'>Traceability</label>
                <input
                  className='field-input'
                  value={editForm.traceability || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, traceability: e.target.value }))
                  }
                />
              </div>
            </div>
            {/* Test Case */}
            <div className='field-group' style={{ marginBottom: 14 }}>
              <label className='field-label'>Test Case</label>
              <textarea
                className='field-input'
                rows={2}
                value={editForm.testCase || ''}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, testCase: e.target.value }))
                }
                style={{ resize: 'vertical' }}
              />
            </div>
            {/* Preconditions, Steps */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div className='field-group'>
                <label className='field-label'>Preconditions</label>
                <RichTextEditor
                  value={editForm.preconditions || ''}
                  onChange={(v) =>
                    setEditForm((f) => ({ ...f, preconditions: v }))
                  }
                  placeholder='List any preconditions…'
                  minHeight={80}
                />
              </div>
              <div className='field-group'>
                <label className='field-label'>Steps</label>
                <RichTextEditor
                  value={editForm.steps || ''}
                  onChange={(v) => setEditForm((f) => ({ ...f, steps: v }))}
                  placeholder='1. Navigate to…'
                  minHeight={80}
                />
              </div>
            </div>
            {/* Expected, Actual */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div className='field-group'>
                <label className='field-label'>Expected Result</label>
                <RichTextEditor
                  value={editForm.expectedResult || ''}
                  onChange={(v) =>
                    setEditForm((f) => ({ ...f, expectedResult: v }))
                  }
                  placeholder='Describe the expected outcome…'
                  minHeight={80}
                />
              </div>
              <div className='field-group'>
                <label className='field-label'>Actual Result</label>
                <RichTextEditor
                  value={editForm.actualResult || ''}
                  onChange={(v) =>
                    setEditForm((f) => ({ ...f, actualResult: v }))
                  }
                  placeholder='Describe the actual outcome…'
                  minHeight={80}
                />
              </div>
            </div>
            {/* Defects */}
            <div className='field-group' style={{ marginBottom: 14 }}>
              <label className='field-label'>Defects / Improvements</label>
              <input
                className='field-input'
                value={editForm.defectsImprovements || ''}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    defectsImprovements: e.target.value,
                  }))
                }
              />
            </div>
            {/* Status, Tested By, Tested On, Version */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 14,
                marginBottom: 20,
              }}
            >
              <div className='field-group'>
                <label className='field-label'>Status</label>
                <select
                  className='field-select'
                  value={editForm.status || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  <option value=''>Pending</option>
                  <option value={STATUS.PASS}>Pass</option>
                  <option value={STATUS.FAIL}>Fail</option>
                </select>
              </div>
              <div className='field-group'>
                <label className='field-label'>Tested By</label>
                <select
                  className='field-select'
                  value={editForm.testedBy || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, testedBy: e.target.value }))
                  }
                >
                  <option value=''>—</option>
                  {qaUsers.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div className='field-group'>
                <label className='field-label'>Tested On</label>
                <input
                  className='field-input'
                  type='date'
                  value={toDateInputValue(editForm.testedOn || '')}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, testedOn: e.target.value }))
                  }
                />
              </div>
              <div className='field-group'>
                <label className='field-label'>Version</label>
                <input
                  className='field-input'
                  value={editForm.softwareVersionTested || ''}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      softwareVersionTested: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div
              style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}
            >
              <button
                type='button'
                className='btn btn-secondary'
                onClick={() => setEditTc(null)}
              >
                Cancel
              </button>
              <button
                type='submit'
                className='btn btn-primary'
                disabled={editSaving}
              >
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Selected Modal */}
      {showAssignModal && (
        <Modal
          title={`Assign ${selectedIds.size} Test Case${
            selectedIds.size !== 1 ? 's' : ''
          }`}
          onClose={() => setShowAssignModal(false)}
          maxWidth={460}
        >
          <form onSubmit={assignTestCases} style={{ display: 'grid', gap: 14 }}>
            <div className='field-group'>
              <label className='field-label'>
                Title{' '}
                <span style={{ color: 'var(--muted)', fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <input
                className='field-input'
                type='text'
                value={assignForm.title}
                onChange={(e) =>
                  setAssignForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder='e.g. Login flow — sprint 12'
              />
            </div>
            <div className='field-group'>
              <label className='field-label'>Assign to</label>
              <select
                className='field-select'
                value={assignForm.assignedTo}
                onChange={(e) =>
                  setAssignForm((f) => ({ ...f, assignedTo: e.target.value }))
                }
                required
              >
                <option value=''>Select team member…</option>
                {qaUsers.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <div className='field-group'>
                <label className='field-label'>Priority</label>
                <select
                  className='field-select'
                  value={assignForm.priority}
                  onChange={(e) =>
                    setAssignForm((f) => ({ ...f, priority: e.target.value }))
                  }
                >
                  <option value={PRIORITIES.HIGH}>High</option>
                  <option value={PRIORITIES.MEDIUM}>Medium</option>
                  <option value={PRIORITIES.LOW}>Low</option>
                </select>
              </div>
              <div className='field-group'>
                <label className='field-label'>Due date</label>
                <input
                  className='field-input'
                  type='date'
                  value={assignForm.dueDate}
                  onChange={(e) =>
                    setAssignForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className='field-group'>
              <label className='field-label'>Notes</label>
              <textarea
                className='field-input'
                rows={2}
                value={assignForm.notes}
                onChange={(e) =>
                  setAssignForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder='Optional context or instructions…'
                style={{ resize: 'vertical' }}
              />
            </div>
            <div
              style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}
            >
              <button
                type='button'
                className='btn btn-secondary'
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                type='submit'
                className='btn btn-primary'
                disabled={assignSaving || !assignForm.assignedTo}
              >
                {assignSaving
                  ? 'Assigning…'
                  : `Assign to ${assignForm.assignedTo || '…'}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function TestCasesClient({ user }) {
  return (
    <Suspense>
      <TestCasesPage user={user} />
    </Suspense>
  );
}
