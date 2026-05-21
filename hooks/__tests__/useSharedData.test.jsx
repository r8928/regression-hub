import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQaUsers } from '../useSharedData';

function wrapper({ children }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useQaUsers', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ qaUsers: ['Alice', 'Bob'] }),
    });
  });

  it('returns qaUsers from settings once resolved', async () => {
    const { result } = renderHook(() => useQaUsers(), { wrapper });
    await waitFor(() => expect(result.current).toEqual(['Alice', 'Bob']));
  });

  it('returns an empty array before settings load', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useQaUsers(), { wrapper });
    expect(result.current).toEqual([]);
  });
});
