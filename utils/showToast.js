import { getEnqueueSnackbar } from '@/app/ThemeRegistry';

const VARIANT_MAP = {
  error: 'error',
  success: 'success',
  info: 'info',
  warning: 'warning',
};

/**
 * Imperatively enqueues a notistack snackbar.
 * Silent no-op when the ThemeRegistry bridge has not mounted yet.
 *
 * @param {string} msg - The message to display.
 * @param {string} [type] - One of 'error' | 'success' | 'info' | 'warning'. Defaults to 'info'.
 * @see {@link utils/__tests__/showToast.test.js}
 */
export function showToast(msg, type) {
  const enqueue = getEnqueueSnackbar();
  if (!enqueue) return; // bridge not mounted yet — silent no-op
  enqueue(msg, { variant: VARIANT_MAP[type] ?? 'info' });
}
