import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQaUsers } from '../useSharedData';

function wrapper({ children }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useQaUsers', () => {
  beforeEach(() => {
    const body = JSON.stringify({ qaUsers: ['Alice', 'Bob'] });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => JSON.parse(body),
      text: async () => body,
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
