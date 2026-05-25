import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/ThemeRegistry', () => ({
  getEnqueueSnackbar: vi.fn(),
}));

import { getEnqueueSnackbar } from '@/app/ThemeRegistry';
import { showToast, ToastProvider } from '../Toast';

describe('showToast (shim contract via components/Toast)', () => {
  let enqueue;

  beforeEach(() => {
    enqueue = vi.fn();
    getEnqueueSnackbar.mockReturnValue(enqueue);
  });

  it('enqueues with variant error for type "error"', () => {
    showToast('msg', 'error');
    expect(enqueue).toHaveBeenCalledWith('msg', { variant: 'error' });
  });

  it('enqueues with variant success for type "success"', () => {
    showToast('msg', 'success');
    expect(enqueue).toHaveBeenCalledWith('msg', { variant: 'success' });
  });

  it('enqueues with variant info for type "info"', () => {
    showToast('msg', 'info');
    expect(enqueue).toHaveBeenCalledWith('msg', { variant: 'info' });
  });

  it('falls back to variant info for an unknown type', () => {
    showToast('msg', 'critical');
    expect(enqueue).toHaveBeenCalledWith('msg', { variant: 'info' });
  });

  it('enqueues with variant warning for type "warning"', () => {
    showToast('msg', 'warning');
    expect(enqueue).toHaveBeenCalledWith('msg', { variant: 'warning' });
  });

  it('does not throw and silently no-ops when bridge is not mounted', () => {
    getEnqueueSnackbar.mockReturnValue(null);
    expect(() => showToast('msg', 'error')).not.toThrow();
    expect(enqueue).not.toHaveBeenCalled();
  });
});

describe('ToastProvider (no-op shim)', () => {
  it('renders children passed to it', () => {
    render(<ToastProvider>hello</ToastProvider>);
    expect(screen.getByText('hello')).toBeDefined();
  });

  it('renders with no children without throwing', () => {
    expect(() => render(<ToastProvider />)).not.toThrow();
  });
});
