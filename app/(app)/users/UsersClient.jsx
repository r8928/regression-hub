'use client';

import { locationToChipColor, roleToChipColor } from '@/app/theme';
import PageHeader from '@/components/PageHeader';
import ToastProvider, { showToast } from '@/components/Toast';
import {
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
} from '@/lib/api/users';
import { ROLES } from '@/lib/constants';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
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
import Panel from '@/components/Panel';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const EMPTY_FORM = {
  name: '',
  username: '',
  password: '',
  confirmPassword: '',
  role: ROLES.QA,
};
const EMPTY_EDIT = { name: '', role: ROLES.QA };
const EMPTY_PWD = { password: '', confirmPassword: '' };

export default function UsersClient({ user, initialUsers }) {
  const router = useRouter();
  const users = initialUsers;

  const roleInfoKey = `roleInfoDismissed:${user.id}`;
  const [showRoleInfo, setShowRoleInfo] = useState(
    () =>
      typeof window === 'undefined' ||
      sessionStorage.getItem(roleInfoKey) !== 'true',
  );
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addSaving, setAddSaving] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editSaving, setEditSaving] = useState(false);

  const [pwdId, setPwdId] = useState(null);
  const [pwdForm, setPwdForm] = useState(EMPTY_PWD);
  const [pwdSaving, setPwdSaving] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    message: '',
    onConfirm: null,
  });

  async function createUser(e) {
    e.preventDefault();
    if (addForm.password !== addForm.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setAddSaving(true);
    try {
      await apiCreateUser({
        name: addForm.name,
        username: addForm.username,
        password: addForm.password,
        role: addForm.role,
      });
      showToast(`User "${addForm.name}" created`, 'success');
      setShowAdd(false);
      setAddForm(EMPTY_FORM);
      router.refresh();
    } catch (err) {
      showToast(err.message || 'Failed to create user', 'error');
    } finally {
      setAddSaving(false);
    }
  }

  async function saveEdit(id) {
    setEditSaving(true);
    try {
      await apiUpdateUser(id, editForm);
      showToast('User updated', 'success');
      setEditId(null);
      router.refresh();
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setEditSaving(false);
    }
  }

  async function savePassword(id) {
    if (pwdForm.password !== pwdForm.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setPwdSaving(true);
    try {
      await apiUpdateUser(id, { password: pwdForm.password });
      showToast('Password updated', 'success');
      setPwdId(null);
      setPwdForm(EMPTY_PWD);
    } catch (err) {
      showToast(err.message || 'Password update failed', 'error');
    } finally {
      setPwdSaving(false);
    }
  }

  function toggleActive(u) {
    const action = u.active !== false ? 'deactivate' : 'activate';
    setConfirmDialog({
      open: true,
      message: `${action.charAt(0).toUpperCase() + action.slice(1)} ${u.name}?`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          await apiUpdateUser(u._id, { active: u.active === false });
          showToast(`User ${action}d`, 'success');
          setEditId(null);
          router.refresh();
        } catch (err) {
          showToast(err.message || 'Action failed', 'error');
        }
      },
    });
  }

  const activeUsers = users.filter((u) => u.active !== false);
  const inactiveUsers = users.filter((u) => u.active === false);

  return (
    <Box>
      <ToastProvider />

      {/* Header */}
      <PageHeader
        eyebrow='Admin'
        title='User Management'
        sub={
          <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
            <Chip
              label={user.teamName}
              color={locationToChipColor(user.teamId)}
              size='small'
            />
            <Typography variant='body2' color='text.secondary'>
              {activeUsers.length} active · {inactiveUsers.length} inactive
            </Typography>
          </Stack>
        }
        actions={
          <Button
            variant='contained'
            color='primary'
            onClick={() => {
              setAddForm(EMPTY_FORM);
              setShowAdd(true);
            }}
          >
            + Add User
          </Button>
        }
      />

      {/* Role permissions info */}
      <Collapse in={showRoleInfo}>
        <Alert
          variant='outlined'
          severity='info'
          onClose={() => {
            sessionStorage.setItem(roleInfoKey, 'true');
            setShowRoleInfo(false);
          }}
          sx={{ mb: 3 }}
        >
          <Grid container spacing={3}>
            {[
              {
                role: ROLES.ADMIN,
                label: 'Admin',
                allow: [
                  'Manage users (create, edit, passwords)',
                  'Import Test Cases & manage versions',
                  'Clear all data',
                  'Full test case access',
                  'Assignments & reports',
                ],
                deny: [],
              },
              {
                role: ROLES.QA,
                label: 'QA',
                allow: [
                  'View & fill test case results',
                  'Manage assignments',
                  'View reports & dashboard',
                  'Export data (Excel / PDF)',
                ],
                deny: ['Import Test Cases', 'Clear data', 'Manage users'],
              },
            ].map(({ role, label, allow, deny }) => (
              <Grid key={role} size={6}>
                <Typography variant='subtitle2' sx={{ mb: 1 }}>
                  {label}
                </Typography>
                <List dense disablePadding>
                  {allow.map((item) => (
                    <ListItem key={item} sx={{ py: 0.25 }}>
                      <ListItemIcon
                        sx={{ minWidth: 28, color: 'success.main' }}
                      >
                        <CheckIcon fontSize='small' />
                      </ListItemIcon>
                      <ListItemText
                        primary={item}
                        slotProps={{
                          primary: {
                            variant: 'caption',
                            color: 'text.disabled',
                          },
                        }}
                      />
                    </ListItem>
                  ))}
                  {deny.map((item) => (
                    <ListItem key={item} sx={{ py: 0.25 }}>
                      <ListItemIcon sx={{ minWidth: 28, color: 'error.main' }}>
                        <CloseIcon fontSize='small' />
                      </ListItemIcon>
                      <ListItemText
                        primary={item}
                        slotProps={{
                          primary: {
                            variant: 'caption',
                            color: 'text.disabled',
                          },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            ))}
          </Grid>
        </Alert>
      </Collapse>

      {/* Users Table */}
      <Panel title='Users' sx={{ mb: 2.5 }}>
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
                <TableCell sx={{ width: 44 }} />
                <TableCell>Name</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ py: 5, textAlign: 'center' }}>
                      <Typography variant='body2' color='text.disabled'>
                        No users found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const isSelf = u._id === user.id;
                  const isActive = u.active !== false;
                  const isEditing = editId === u._id;
                  const isAdmin = u.role === ROLES.ADMIN;

                  return (
                    <TableRow
                      key={u._id}
                      hover
                      sx={{ opacity: isActive ? 1 : 0.5 }}
                    >
                      <TableCell sx={{ py: 1.25, px: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: isAdmin
                              ? 'primary.main'
                              : 'secondary.main',
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {(u.name || '?')[0].toUpperCase()}
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size='small'
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                name: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          <Stack
                            direction='row'
                            spacing={0.75}
                            sx={{ alignItems: 'center' }}
                          >
                            <Typography variant='body2' fontWeight={600}>
                              {u.name}
                            </Typography>
                            {isSelf && (
                              <Typography
                                variant='caption'
                                color='primary.main'
                                fontWeight={700}
                                fontSize={10}
                              >
                                YOU
                              </Typography>
                            )}
                          </Stack>
                        )}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: 12,
                          color: 'text.disabled',
                        }}
                      >
                        <Typography variant='mono'>{u.username}</Typography>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            select
                            size='small'
                            label='Role'
                            value={editForm.role}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                role: e.target.value,
                              }))
                            }
                            sx={{ minWidth: 100 }}
                          >
                            <MenuItem value={ROLES.ADMIN}>Admin</MenuItem>
                            <MenuItem value={ROLES.QA}>QA</MenuItem>
                          </TextField>
                        ) : (
                          <Chip
                            label={u.role === ROLES.ADMIN ? 'Admin' : 'QA'}
                            color={roleToChipColor(u.role)}
                            size='small'
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={isActive ? 'Active' : 'Inactive'}
                          color={isActive ? 'success' : 'default'}
                          size='small'
                          variant={isActive ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: 'text.disabled' }}>
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell align='right'>
                        {isEditing ? (
                          <Stack
                            direction='row'
                            spacing={0.75}
                            sx={{ justifyContent: 'flex-end' }}
                          >
                            <Button
                              variant='outlined'
                              size='small'
                              onClick={() => setEditId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant='contained'
                              color='primary'
                              size='small'
                              loading={editSaving}
                              onClick={() => saveEdit(u._id)}
                            >
                              Save
                            </Button>
                          </Stack>
                        ) : (
                          <Stack
                            direction='row'
                            spacing={0.75}
                            sx={{ justifyContent: 'flex-end' }}
                          >
                            <Button
                              variant='outlined'
                              size='small'
                              title='Edit name / role'
                              onClick={() => {
                                setEditId(u._id);
                                setEditForm({ name: u.name, role: u.role });
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant='outlined'
                              size='small'
                              title='Change password'
                              onClick={() => {
                                setPwdId(u._id);
                                setPwdForm(EMPTY_PWD);
                              }}
                            >
                              Password
                            </Button>
                            {!isSelf && (
                              <Button
                                variant='outlined'
                                color={isActive ? 'error' : 'inherit'}
                                size='small'
                                title={
                                  isActive
                                    ? 'Deactivate user'
                                    : 'Reactivate user'
                                }
                                onClick={() => toggleActive(u)}
                              >
                                {isActive ? '⊘' : '↺'}
                              </Button>
                            )}
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Panel>

      {/* Add User Dialog */}
      <Dialog
        open={showAdd}
        onClose={() => {
          setShowAdd(false);
          setAddForm(EMPTY_FORM);
        }}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent dividers>
          <Box
            component='form'
            onSubmit={createUser}
            sx={{ display: 'grid', gap: 1.75 }}
          >
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}
            >
              <TextField
                size='small'
                fullWidth
                label='Full name'
                type='text'
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder='e.g. Maria'
                required
              />
              <TextField
                size='small'
                fullWidth
                label='Username'
                type='text'
                value={addForm.username}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    username: e.target.value.toLowerCase().replace(/\s/g, ''),
                  }))
                }
                placeholder='e.g. maria'
                required
              />
            </Box>

            <Box>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ mb: 0.75, display: 'block' }}
              >
                Role
              </Typography>
              <Stack direction='row' spacing={1}>
                {[ROLES.QA, ROLES.ADMIN].map((r) => (
                  <Button
                    key={r}
                    type='button'
                    variant={addForm.role === r ? 'contained' : 'outlined'}
                    color={r === ROLES.ADMIN ? 'primary' : 'secondary'}
                    onClick={() => setAddForm((f) => ({ ...f, role: r }))}
                    sx={{ flex: 1 }}
                  >
                    {r === ROLES.ADMIN ? '⚙ Admin' : '◎ QA'}
                  </Button>
                ))}
              </Stack>
              <Typography
                variant='caption'
                color='text.disabled'
                sx={{ mt: 0.75, display: 'block' }}
              >
                {addForm.role === ROLES.ADMIN
                  ? 'Can manage users, import test cases, clear data, and manage versions.'
                  : 'Can fill test results, manage assignments, and export data.'}
              </Typography>
            </Box>

            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}
            >
              <TextField
                size='small'
                fullWidth
                label='Password'
                type='password'
                value={addForm.password}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder='Min. 8 characters'
                required
                inputProps={{ minLength: 8 }}
              />
              <TextField
                size='small'
                fullWidth
                label='Confirm password'
                type='password'
                value={addForm.confirmPassword}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder='Repeat password'
                required
              />
            </Box>

            <Alert severity='info'>
              This user will be added to the <strong>{user.teamName}</strong>{' '}
              location and can only see that location&apos;s data.
            </Alert>

            <Stack
              direction='row'
              spacing={1.25}
              sx={{ justifyContent: 'flex-end' }}
            >
              <Button
                type='button'
                variant='outlined'
                onClick={() => {
                  setShowAdd(false);
                  setAddForm(EMPTY_FORM);
                }}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                variant='contained'
                color='primary'
                loading={addSaving}
              >
                Create User
              </Button>
            </Stack>
          </Box>
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

      {/* Change Password Dialog */}
      <Dialog
        open={!!pwdId}
        onClose={() => {
          setPwdId(null);
          setPwdForm(EMPTY_PWD);
        }}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>
          Change Password —{' '}
          {users.find((u) => u._id === pwdId)?.name ?? 'Unknown'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.75}>
            <TextField
              size='small'
              fullWidth
              label='New password'
              type='password'
              value={pwdForm.password}
              onChange={(e) =>
                setPwdForm((f) => ({ ...f, password: e.target.value }))
              }
              placeholder='Min. 8 characters'
              required
              inputProps={{ minLength: 8 }}
            />
            <TextField
              size='small'
              fullWidth
              label='Confirm password'
              type='password'
              value={pwdForm.confirmPassword}
              onChange={(e) =>
                setPwdForm((f) => ({ ...f, confirmPassword: e.target.value }))
              }
              placeholder='Repeat password'
              required
            />
            <Stack
              direction='row'
              spacing={1.25}
              sx={{ justifyContent: 'flex-end' }}
            >
              <Button
                variant='outlined'
                onClick={() => {
                  setPwdId(null);
                  setPwdForm(EMPTY_PWD);
                }}
              >
                Cancel
              </Button>
              <Button
                variant='contained'
                color='primary'
                loading={pwdSaving}
                disabled={!pwdForm.password || pwdForm.password.length < 8}
                onClick={() => savePassword(pwdId)}
              >
                Update Password
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
