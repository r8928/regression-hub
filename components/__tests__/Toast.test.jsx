import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ToastProvider, { showToast } from '../Toast';

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastProvider />);
    expect(container.firstChild).toBeNull();
  });

  it('displays a toast message after showToast is called', () => {
    render(<ToastProvider />);
    act(() => {
      showToast('Saved successfully');
    });
    expect(screen.getByText('Saved successfully')).toBeInTheDocument();
  });

  it('shows success icon for success type', () => {
    render(<ToastProvider />);
    act(() => {
      showToast('Done', 'success');
    });
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('shows error icon for error type', () => {
    render(<ToastProvider />);
    act(() => {
      showToast('Failed', 'error');
    });
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('shows info icon for info type', () => {
    render(<ToastProvider />);
    act(() => {
      showToast('Note', 'info');
    });
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('removes the toast after the duration elapses', () => {
    render(<ToastProvider />);
    act(() => {
      showToast('Temporary', 'success', 1000);
    });
    expect(screen.getByText('Temporary')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000 + 220 + 50);
    });
    expect(screen.queryByText('Temporary')).toBeNull();
  });

  it('shows multiple toasts simultaneously', () => {
    render(<ToastProvider />);
    act(() => {
      showToast('First');
      showToast('Second');
    });
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});
