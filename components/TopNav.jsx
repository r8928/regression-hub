'use client';

import { locationToChipColor, roleToChipColor } from '@/app/theme';
import { ROLES } from '@/lib/constants';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BugReportIcon from '@mui/icons-material/BugReport';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const DRAWER_WIDTH = 240;

const NAV = [
  { href: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { href: '/test-cases', label: 'Test Cases', Icon: BugReportIcon },
  { href: '/assignments', label: 'Assignments', Icon: AssignmentIcon },
  { href: '/test-runs', label: 'Test Runs', Icon: PlaylistPlayIcon },
  { href: '/reports', label: 'Reports', Icon: AssessmentIcon },
];

const ADMIN_NAV = [
  { href: '/users', label: 'Users', Icon: PeopleIcon },
  { href: '/import-cases', label: 'Import Test Cases', Icon: UploadFileIcon },
];

/** @see {@link __tests__/TopNav.test.jsx} */
export default function TopNav({ user }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminAnchor, setAdminAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);

  const userInitials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?';

  const pathname = usePathname();
  const isActive = (href) =>
    pathname === href || pathname.startsWith(href + '/');

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, bgcolor: 'nav.main', minHeight: '100%' }}>
      {/* Brand header */}
      <Stack
        direction='row'
        spacing={1}
        sx={{ alignItems: 'center', px: 2, py: 1.75, minHeight: 64 }}
      >
        <Stack
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            borderRadius: 1,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 13 }}>
            QA
          </Typography>
        </Stack>
        <Box>
          <Typography
            variant='navBrand'
            sx={{ color: 'white', display: 'block' }}
          >
            Regression Hub
          </Typography>
          <Typography
            variant='metricSub'
            sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}
          >
            Testing management
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <List dense sx={{ py: 1 }}>
        {NAV.map(({ href, label, Icon }) => (
          <ListItemButton
            key={href}
            component={Link}
            href={href}
            selected={isActive(href)}
            onClick={() => setMobileOpen(false)}
            sx={{
              mx: 1,
              borderRadius: 1,
              mb: 0.25,
              '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.12)' },
              '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
            }}
          >
            <ListItemIcon
              sx={{ color: 'rgba(255,255,255,0.75)', minWidth: 36 }}
            >
              <Icon fontSize='small' />
            </ListItemIcon>
            <ListItemText
              primary={label}
              slotProps={{
                primary: { variant: 'navItem', sx: { color: 'white' } },
              }}
            />
          </ListItemButton>
        ))}

        {user?.role === ROLES.ADMIN && (
          <>
            <Typography
              variant='metricLabel'
              sx={{
                display: 'block',
                px: 2,
                pt: 1.5,
                pb: 0.5,
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              Admin
            </Typography>
            {ADMIN_NAV.map(({ href, label, Icon }) => (
              <ListItemButton
                key={href}
                component={Link}
                href={href}
                selected={isActive(href)}
                onClick={() => setMobileOpen(false)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  mb: 0.25,
                  '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.12)' },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.07)' },
                }}
              >
                <ListItemIcon
                  sx={{ color: 'rgba(255,255,255,0.75)', minWidth: 36 }}
                >
                  <Icon fontSize='small' />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  slotProps={{
                    primary: { variant: 'navItem', sx: { color: 'white' } },
                  }}
                />
              </ListItemButton>
            ))}
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position='fixed' sx={{ bgcolor: 'nav.main' }}>
        <Toolbar>
          {/* Hamburger — mobile only */}
          <IconButton
            color='inherit'
            edge='start'
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 2, display: { md: 'none' } }}
            aria-label='open navigation'
          >
            <MenuIcon />
          </IconButton>

          {/* Brand */}
          <Stack
            direction='row'
            spacing={1}
            sx={{ alignItems: 'center', mr: 3 }}
          >
            <Stack
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
                borderRadius: 1,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{ color: 'white', fontWeight: 700, fontSize: 13 }}
              >
                QA
              </Typography>
            </Stack>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography
                variant='navBrand'
                sx={{ color: 'white', display: 'block' }}
              >
                Regression Hub
              </Typography>
              <Typography
                variant='metricSub'
                sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}
              >
                Testing management
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ flex: 1 }} />

          {/* Desktop nav */}
          <Stack
            direction='row'
            spacing={0.5}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            {NAV.map(({ href, label, Icon }) => (
              <Tooltip key={href} title={label}>
                <IconButton
                  component={Link}
                  href={href}
                  color={isActive(href) ? 'primary' : 'inherit'}
                  size='large'
                  aria-label={label}
                >
                  <Icon />
                </IconButton>
              </Tooltip>
            ))}
          </Stack>

          {/* Admin menu — desktop only; mobile uses the Drawer */}
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            {user?.role === ROLES.ADMIN && (
              <>
                <Tooltip title='Admin'>
                  <IconButton
                    color='inherit'
                    size='large'
                    onClick={(e) => setAdminAnchor(e.currentTarget)}
                    aria-label='admin menu'
                  >
                    <AdminPanelSettingsIcon />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={adminAnchor}
                  open={Boolean(adminAnchor)}
                  onClose={() => setAdminAnchor(null)}
                >
                  {ADMIN_NAV.map(({ href, label, Icon }) => (
                    <MenuItem
                      key={href}
                      component={Link}
                      href={href}
                      onClick={() => setAdminAnchor(null)}
                    >
                      <ListItemIcon>
                        <Icon fontSize='small' />
                      </ListItemIcon>
                      <ListItemText>{label}</ListItemText>
                    </MenuItem>
                  ))}
                </Menu>
              </>
            )}
          </Box>

          {/* Profile menu */}
          <Tooltip title='Account'>
            <IconButton
              onClick={(e) => setProfileAnchor(e.currentTarget)}
              size='large'
              sx={{ ml: 1 }}
              aria-label='account menu'
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: 13,
                }}
              >
                {userInitials}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={() => setProfileAnchor(null)}
            slotProps={{ paper: { sx: { minWidth: 200 } } }}
          >
            <MenuItem disabled sx={{ opacity: '1 !important' }}>
              <Stack spacing={0.75}>
                <Typography variant='tableCell' sx={{ fontWeight: 600 }}>
                  {user?.name}
                </Typography>
                <Stack direction='row' spacing={0.75} sx={{ flexWrap: 'wrap' }}>
                  <Chip
                    label={user?.teamName}
                    color={locationToChipColor(user?.teamId)}
                    size='small'
                    variant='outlined'
                  />
                  <Chip
                    label={user?.role === ROLES.ADMIN ? 'Admin' : 'QA'}
                    color={roleToChipColor(user?.role)}
                    size='small'
                    variant='outlined'
                  />
                </Stack>
              </Stack>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
              <ListItemIcon>
                <LogoutIcon fontSize='small' />
              </ListItemIcon>
              <ListItemText>Sign Out</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant='temporary'
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
