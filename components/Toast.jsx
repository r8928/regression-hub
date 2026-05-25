'use client';
// Backward-compat re-export. Replaced by notistack in Phase 3.
// TODO: follow-up ticket will sweep call sites to useSnackbar() directly.
export { showToast } from '@/utils/showToast';

/**
 * No-op shim so existing default-import callers (`import ToastProvider from '@/components/Toast'`)
 * continue to compile without modification. Notistack's SnackbarProvider is mounted in
 * ThemeRegistry, so this wrapper is no longer needed.
 */
export function ToastProvider({ children }) {
  return <>{children}</>;
}

export default ToastProvider;
