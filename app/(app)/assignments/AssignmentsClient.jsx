'use client';

import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { priorityToColor } from '@/app/theme';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import ToastProvider, { showToast } from '@/components/Toast';
import {
  createAssignment as apiCreateAssignment,
  deleteAssignment as apiDeleteAssignment,
  updateAssignment as apiUpdateAssignment,
} from '@/lib/api/assignments';
import {
  ASSIGNMENT_STATUS,
  PRIORITIES,
  PRIORITY_DEFAULT,
} from '@/lib/constants';

function ProgressBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const color = pct === 100 ? 'success' : pct > 50 ? 'info' : 'warning';
  return (
    <Box>
      <Stack direction='row' sx={{ justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant='caption' color='text.disabled'>
          {completed} / {total} tested
        </Typography>
        <Typography
          variant='caption'
          fontWeight={600}
          color={
            pct === 100
              ? 'success.main'
              : pct > 50
                ? 'info.main'
                : 'warning.main'
          }
        >
          {pct}%
        </Typography>
      </Stack>
      <LinearProgress
        variant='determinate'
        value={pct}
        color={color}
        sx={{ borderRadius: 1, height: 6 }}
      />
    </Box>
  );
}

function DueDate({ dueDate }) {
  if (!dueDate)
    return (
      <Typography component='span' variant='caption' color='text.disabled'>
        No due date
      </Typography>
    );
  const due = new Date(dueDate);
  const now = new Date();
  const isOverdue = due < now;
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  const label = isOverdue
    ? `Overdue by ${Math.abs(diff)}d`
    : diff === 0
      ? 'Due today'
      : diff === 1
        ? 'Due tomorrow'
        : `Due in ${diff}d`;
  return (
    <Typography
      component='span'
      variant='caption'
      fontWeight={600}
      color={
        isOverdue ? 'error.main' : diff <= 2 ? 'warning.main' : 'text.disabled'
      }
    >
      ◷ {due.toLocaleDateString()} — {label}
    </Typography>
  );
}

const EMPTY_FORM = {
  title: '',
  type: 'module',
  moduleIds: [],
  testCaseIds: [],
  assignedTo: '',
  priority: PRIORITY_DEFAULT,
  dueDate: '',
  notes: '',
};

export default function AssignmentsClient({
  user,
  view,
  assignments,
  modules,
  moduleCounts,
  qaUsers,
}) {
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    message: '',
    onConfirm: null,
  });

  async function createAssignment(e) {
    e.preventDefault();
    if (!form.assignedTo) {
      showToast('Select an assignee', 'info');
      return;
    }
    if (form.type === 'module' && !form.moduleIds.length) {
      showToast('Select at least one module', 'info');
      return;
    }

    setSaving(true);
    try {
      const data = await apiCreateAssignment(form);
      showToast(
        `Assignment created — ${data.testCaseCount} test cases`,
        'success',
      );
      setShowModal(false);
      setForm(EMPTY_FORM);
      router.refresh();
    } catch (err) {
      showToast(err.message || 'Failed to create', 'error');
    } finally {
      setSaving(false);
    }
  }

  function cancelAssignment(id) {
    setConfirmDialog({
      open: true,
      message:
        'Cancel this assignment? The test cases will remain but lose their assignment.',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          await apiDeleteAssignment(id);
          showToast('Assignment cancelled', 'info');
          router.refresh();
        } catch (err) {
          showToast(err.message || 'Failed to cancel', 'error');
        }
      },
    });
  }

  async function saveEdit(id) {
    try {
      await apiUpdateAssignment(id, editForm);
      showToast('Updated', 'success');
      setEditId(null);
      router.refresh();
    } catch (err) {
      showToast(err.message || 'Failed to update', 'error');
    }
  }

  function viewCases(a) {
    router.push(`/test-cases?assignedTo=${encodeURIComponent(a.assignedTo)}`);
  }

  const active = assignments.filter(
    (a) => a.status === ASSIGNMENT_STATUS.ACTIVE,
  );
  const cancelled = assignments.filter(
    (a) => a.status !== ASSIGNMENT_STATUS.ACTIVE,
  );

  return (
    <Box>
      <ToastProvider />

      {/* Header */}
      <PageHeader
        eyebrow='Team'
        title='Assignments'
        sub='Assign test cases and modules to team members'
        actions={
          <Button
            variant='contained'
            onClick={() => {
              setForm(EMPTY_FORM);
              setShowModal(true);
            }}
          >
            + New Assignment
          </Button>
        }
      />

      {/* Tabs */}
      <Tabs
        value={view}
        onChange={(_, v) => v && router.push(`?view=${v}`)}
        sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label='Assigned to Me' value='mine' />
        <Tab label='Assigned by Me' value='sent' />
      </Tabs>

      {/* Cards */}
      {active.length === 0 ? (
        <EmptyState
          icon={<AssignmentOutlined />}
          title={
            view === 'mine'
              ? 'No assignments for you yet'
              : "You haven't assigned anything yet"
          }
        >
          <Typography variant='body2' color='text.disabled' sx={{ mt: 0.75 }}>
            {view === 'mine'
              ? 'Ask a team member to assign test cases to you.'
              : 'Click "New Assignment" to assign a module or test cases.'}
          </Typography>
        </EmptyState>
      ) : (
        <Stack spacing={1.75}>
          {active.map((a) => (
            <AssignmentCard
              key={a._id}
              assignment={a}
              isMine={view === 'mine'}
              isSent={view === 'sent'}
              isEditing={editId === a._id}
              editForm={editForm}
              onEdit={() => {
                setEditId(a._id);
                setEditForm({
                  title: a.title,
                  notes: a.notes,
                  priority: a.priority,
                  dueDate: a.dueDate ? a.dueDate.slice(0, 10) : '',
                });
              }}
              onEditChange={(f) => setEditForm((prev) => ({ ...prev, ...f }))}
              onSaveEdit={() => saveEdit(a._id)}
              onCancelEdit={() => setEditId(null)}
              onCancel={() => cancelAssignment(a._id)}
              onViewCases={() => viewCases(a)}
            />
          ))}
        </Stack>
      )}

      {cancelled.length > 0 && (
        <Accordion
          disableGutters
          elevation={0}
          variant='outlined'
          sx={{ mt: 3 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant='body2'>
              Cancelled ({cancelled.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Stack spacing={1.25} sx={{ p: 1.25 }}>
              {cancelled.map((a) => (
                <Paper
                  key={a._id}
                  variant='outlined'
                  sx={{
                    opacity: 0.55,
                    px: 2.25,
                    py: 1.75,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant='body2' fontWeight={600}>
                      {a.title}
                    </Typography>
                    <Typography
                      variant='caption'
                      color='text.disabled'
                      sx={{ mt: 0.25, display: 'block' }}
                    >
                      {a.assignedBy} → {a.assignedTo} · {a.testCaseCount} cases
                      · Cancelled
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

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

      {/* Create Assignment Modal */}
      <Dialog
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setForm(EMPTY_FORM);
        }}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>New Assignment</DialogTitle>
        <DialogContent dividers>
          <form onSubmit={createAssignment}>
            <Stack spacing={2}>
              {/* Title */}
              <TextField
                size='small'
                fullWidth
                label={
                  <>
                    Title{' '}
                    <Typography
                      component='span'
                      variant='caption'
                      color='text.disabled'
                      fontWeight={400}
                    >
                      (optional)
                    </Typography>
                  </>
                }
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder='e.g. Auth Module — v2.5 regression'
              />

              {/* Scope: Module or Manual selection */}
              <Box>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  fontWeight={500}
                  sx={{ mb: 0.75, display: 'block' }}
                >
                  Scope
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={form.type}
                  onChange={(_, v) =>
                    v &&
                    setForm((f) => ({
                      ...f,
                      type: v,
                      moduleIds: [],
                      testCaseIds: [],
                    }))
                  }
                  size='small'
                  fullWidth
                >
                  <ToggleButton value='module'>⊞ By Module</ToggleButton>
                  <ToggleButton value='selection'>◎ By Selection</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Module picker */}
              {form.type === 'module' && (
                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    fontWeight={500}
                    sx={{ mb: 0.75, display: 'block' }}
                  >
                    Modules to assign
                  </Typography>
                  <Stack
                    spacing={0.5}
                    sx={{
                      maxHeight: 200,
                      overflowY: 'auto',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 1,
                    }}
                  >
                    {modules.length === 0 ? (
                      <Typography
                        variant='caption'
                        color='text.disabled'
                        sx={{ p: 1 }}
                      >
                        No modules found
                      </Typography>
                    ) : (
                      modules.map((m) => {
                        const checked = form.moduleIds.includes(m._id);
                        const count = moduleCounts[m._id] ?? '…';
                        return (
                          <Stack
                            key={m._id}
                            component='label'
                            direction='row'
                            spacing={1}
                            sx={{
                              alignItems: 'center',
                              px: 1,
                              py: 0.75,
                              borderRadius: 1.5,
                              cursor: 'pointer',
                              bgcolor: checked ? 'primary.50' : 'transparent',
                              border: '1px solid',
                              borderColor: checked
                                ? 'primary.200'
                                : 'transparent',
                            }}
                          >
                            <input
                              type='checkbox'
                              checked={checked}
                              onChange={() =>
                                setForm((f) => ({
                                  ...f,
                                  moduleIds: checked
                                    ? f.moduleIds.filter((id) => id !== m._id)
                                    : [...f.moduleIds, m._id],
                                }))
                              }
                            />
                            <Box
                              component='span'
                              sx={{ flex: 1, fontSize: 13 }}
                            >
                              <Typography
                                component='span'
                                variant='caption'
                                color='text.disabled'
                              >
                                {m.applicationName} /
                              </Typography>{' '}
                              {m.name}
                            </Box>
                            <Typography
                              component='span'
                              variant='caption'
                              color='text.disabled'
                            >
                              {count} cases
                            </Typography>
                          </Stack>
                        );
                      })
                    )}
                  </Stack>
                </Box>
              )}

              {form.type === 'selection' && (
                <Alert severity='info' variant='outlined'>
                  To assign specific test cases, select them on the{' '}
                  <strong>Test Cases</strong> page and click the{' '}
                  <Box component='strong' sx={{ color: 'primary.main' }}>
                    Assign
                  </Box>{' '}
                  button.
                </Alert>
              )}

              {/* Assignee */}
              <TextField
                select
                size='small'
                fullWidth
                label='Assign to'
                value={form.assignedTo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, assignedTo: e.target.value }))
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

              {/* Priority + Due Date */}
              <Grid container spacing={1.5}>
                <Grid size={6}>
                  <TextField
                    select
                    size='small'
                    fullWidth
                    label='Priority'
                    value={form.priority}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, priority: e.target.value }))
                    }
                  >
                    <MenuItem value={PRIORITIES.HIGH}>High</MenuItem>
                    <MenuItem value={PRIORITIES.MEDIUM}>Medium</MenuItem>
                    <MenuItem value={PRIORITIES.LOW}>Low</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={6}>
                  <TextField
                    size='small'
                    fullWidth
                    type='date'
                    label={
                      <>
                        Due date{' '}
                        <Typography
                          component='span'
                          variant='caption'
                          color='text.disabled'
                          fontWeight={400}
                        >
                          (optional)
                        </Typography>
                      </>
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dueDate: e.target.value }))
                    }
                  />
                </Grid>
              </Grid>

              {/* Notes */}
              <TextField
                size='small'
                fullWidth
                multiline
                rows={3}
                label={
                  <>
                    Notes{' '}
                    <Typography
                      component='span'
                      variant='caption'
                      color='text.disabled'
                      fontWeight={400}
                    >
                      (optional)
                    </Typography>
                  </>
                }
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder='Instructions, context, or special focus areas…'
                slotProps={{ htmlInput: { style: { resize: 'vertical' } } }}
              />
            </Stack>

            <Stack
              direction='row'
              spacing={1.25}
              sx={{ justifyContent: 'flex-end', mt: 2.5 }}
            >
              <Button
                type='button'
                variant='outlined'
                onClick={() => {
                  setShowModal(false);
                  setForm(EMPTY_FORM);
                }}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                variant='contained'
                disabled={
                  saving ||
                  (form.type === 'module' && !form.moduleIds.length) ||
                  !form.assignedTo
                }
              >
                {saving ? 'Creating…' : 'Create Assignment'}
              </Button>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function AssignmentCard({
  assignment: a,
  isMine,
  isSent,
  isEditing,
  editForm,
  onEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onCancel,
  onViewCases,
}) {
  const priorityStripeColor =
    a.priority === PRIORITIES.HIGH
      ? 'error.main'
      : a.priority === PRIORITIES.LOW
        ? 'success.main'
        : 'warning.main';

  return (
    <Paper variant='outlined' sx={{ overflow: 'hidden', p: 0 }}>
      {/* Priority stripe */}
      <Box
        sx={{
          height: 4,
          bgcolor: priorityStripeColor,
        }}
      />

      <Box sx={{ px: 2.5, py: 2 }}>
        {isEditing ? (
          /* Edit mode */
          <Stack spacing={1.5}>
            <TextField
              size='small'
              fullWidth
              label='Title'
              value={editForm.title || ''}
              onChange={(e) => onEditChange({ title: e.target.value })}
            />
            <Grid container spacing={1.5}>
              <Grid size={6}>
                <TextField
                  select
                  size='small'
                  fullWidth
                  label='Priority'
                  value={editForm.priority || PRIORITY_DEFAULT}
                  onChange={(e) => onEditChange({ priority: e.target.value })}
                >
                  <MenuItem value={PRIORITIES.HIGH}>High</MenuItem>
                  <MenuItem value={PRIORITIES.MEDIUM}>Medium</MenuItem>
                  <MenuItem value={PRIORITIES.LOW}>Low</MenuItem>
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField
                  size='small'
                  fullWidth
                  type='date'
                  label='Due date'
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={editForm.dueDate || ''}
                  onChange={(e) => onEditChange({ dueDate: e.target.value })}
                />
              </Grid>
            </Grid>
            <TextField
              size='small'
              fullWidth
              multiline
              rows={2}
              label='Notes'
              value={editForm.notes || ''}
              onChange={(e) => onEditChange({ notes: e.target.value })}
              slotProps={{ htmlInput: { style: { resize: 'vertical' } } }}
            />
            <Stack
              direction='row'
              spacing={1}
              sx={{ justifyContent: 'flex-end' }}
            >
              <Button variant='outlined' size='small' onClick={onCancelEdit}>
                Cancel
              </Button>
              <Button variant='contained' size='small' onClick={onSaveEdit}>
                Save
              </Button>
            </Stack>
          </Stack>
        ) : (
          /* View mode */
          <>
            <Stack
              direction='row'
              spacing={1.5}
              sx={{
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                mb: 1.5,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack
                  direction='row'
                  spacing={1}
                  sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}
                >
                  <Typography variant='body1' fontWeight={700}>
                    {a.title}
                  </Typography>
                  <Chip
                    label={a.priority || 'Medium'}
                    color={priorityToColor(a.priority)}
                    size='small'
                  />
                </Stack>
                <Stack
                  direction='row'
                  sx={{
                    flexWrap: 'wrap',
                    rowGap: 0.5,
                    columnGap: 1.75,
                    color: 'text.disabled',
                  }}
                >
                  {isMine && (
                    <Typography variant='caption' color='text.disabled'>
                      From:{' '}
                      <Typography
                        component='strong'
                        variant='caption'
                        fontWeight={600}
                        color='text.primary'
                      >
                        {a.assignedBy}
                      </Typography>
                    </Typography>
                  )}
                  {isSent && (
                    <Typography variant='caption' color='text.disabled'>
                      To:{' '}
                      <Typography
                        component='strong'
                        variant='caption'
                        fontWeight={600}
                        color='text.primary'
                      >
                        {a.assignedTo}
                      </Typography>
                    </Typography>
                  )}
                  <Typography variant='caption' color='text.disabled'>
                    {a.type === 'module'
                      ? `⊞ ${a.moduleIds?.length || 1} module${
                          (a.moduleIds?.length || 1) !== 1 ? 's' : ''
                        }`
                      : '◎ Selection'}
                    · {a.testCaseCount} test case
                    {a.testCaseCount !== 1 ? 's' : ''}
                  </Typography>
                  <DueDate dueDate={a.dueDate} />
                </Stack>
              </Box>
              <Stack direction='row' spacing={0.75} sx={{ flexShrink: 0 }}>
                {isSent && (
                  <Button
                    variant='outlined'
                    size='small'
                    onClick={onEdit}
                    title='Edit assignment'
                  >
                    ✎
                  </Button>
                )}
                <Button variant='contained' size='small' onClick={onViewCases}>
                  View Cases
                </Button>
                {isSent && (
                  <Button
                    variant='outlined'
                    color='error'
                    size='small'
                    onClick={onCancel}
                    title='Cancel assignment'
                    sx={{ minWidth: 0, px: 1.25 }}
                  >
                    ✕
                  </Button>
                )}
              </Stack>
            </Stack>

            <ProgressBar completed={a.completedCount} total={a.testCaseCount} />

            {a.notes && (
              <Box
                sx={{
                  mt: 1.25,
                  px: 1.5,
                  py: 1,
                  bgcolor: 'background.default',
                  borderRadius: 1.5,
                  borderLeft: '3px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant='caption' color='text.disabled'>
                  {a.notes}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
}
