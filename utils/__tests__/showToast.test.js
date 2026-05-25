import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock ThemeRegistry before importing showToast so the module picks up the mock
vi.mock('@/app/ThemeRegistry', () => ({
  getEnqueueSnackbar: vi.fn(),
}));

import { getEnqueueSnackbar } from '@/app/ThemeRegistry';
import { showToast } from '@/utils/showToast';

describe('showToast', () => {
  let enqueue;

  beforeEach(() => {
    enqueue = vi.fn();
    getEnqueueSnackbar.mockReturnValue(enqueue);
  });

  it('enqueues with variant error for type "error"', () => {
    showToast('Something went wrong', 'error');
    expect(enqueue).toHaveBeenCalledWith('Something went wrong', {
      variant: 'error',
    });
  });

  it('enqueues with variant success for type "success"', () => {
    showToast('Saved', 'success');
    expect(enqueue).toHaveBeenCalledWith('Saved', { variant: 'success' });
  });

  it('enqueues with variant info for type "info"', () => {
    showToast('FYI', 'info');
    expect(enqueue).toHaveBeenCalledWith('FYI', { variant: 'info' });
  });

  it('falls back to variant info when type is undefined', () => {
    showToast('Hello');
    expect(enqueue).toHaveBeenCalledWith('Hello', { variant: 'info' });
  });

  it('falls back to variant info for an unknown type', () => {
    showToast('Hmm', 'critical');
    expect(enqueue).toHaveBeenCalledWith('Hmm', { variant: 'info' });
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
