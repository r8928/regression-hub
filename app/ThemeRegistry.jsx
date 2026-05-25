'use client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { useEffect } from 'react';
import theme from './theme';

// Module-level ref so showToast shim (Phase 3) can call enqueueSnackbar imperatively
let _enqueueSnackbar = null;
export function getEnqueueSnackbar() {
  return _enqueueSnackbar;
}

function NotistackBridge() {
  const { enqueueSnackbar } = useSnackbar();
  useEffect(() => {
    _enqueueSnackbar = enqueueSnackbar;
    return () => {
      _enqueueSnackbar = null;
    };
  }, [enqueueSnackbar]);
  return null;
}

export default function ThemeRegistry({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <NotistackBridge />
        {children}
      </SnackbarProvider>
    </ThemeProvider>
  );
}
