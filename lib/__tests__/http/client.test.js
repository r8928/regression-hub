import { ApiError } from '@/lib/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));
vi.mock('@/components/Toast', () => ({ showToast }));

import { del, get, patch, post, put, request } from '@/lib/http/client';

beforeEach(() => {
  showToast.mockClear();
  vi.stubGlobal('fetch', vi.fn());
});

describe('request', () => {
  it('builds query string from params', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    });
    await get('/api/foo', { params: { a: '1', b: 'two' } });
    expect(fetch).toHaveBeenCalledWith(
      '/api/foo?a=1&b=two',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('serializes JSON body and sets Content-Type', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{}',
    });
    await post('/api/foo', { name: 'x' });
    expect(fetch).toHaveBeenCalledWith(
      '/api/foo',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'x' }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('does not set Content-Type for FormData', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{}',
    });
    const form = new FormData();
    form.append('file', 'x');
    await post('/api/upload', form);
    const call = fetch.mock.calls[0][1];
    expect(call.headers?.['Content-Type']).toBeUndefined();
  });

  it('throws ApiError with server error message and shows toast', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ error: 'Name required' }),
    });
    await expect(get('/api/foo')).rejects.toMatchObject({
      status: 400,
      message: 'Name required',
    });
    expect(showToast).toHaveBeenCalledWith('Name required', 'error');
  });

  it('silentFailure returns null without toast', async () => {
    fetch.mockRejectedValue(new Error('network down'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await get('/api/foo', { silentFailure: true });
    expect(result).toBeNull();
    expect(showToast).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('hard-fails on Zod schema mismatch', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ wrong: true }),
    });
    await expect(
      get('/api/foo', { schema: z.object({ id: z.string() }) }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('calls onStatus with response status', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 204,
      text: async () => '',
    });
    const onStatus = vi.fn();
    await request('/api/foo', { onStatus });
    expect(onStatus).toHaveBeenCalledWith(204);
  });
});

describe('verb helpers', () => {
  it('patch put del use correct methods', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{}',
    });
    await patch('/api/x', { a: 1 });
    await put('/api/x', { b: 2 });
    await del('/api/x');
    expect(fetch.mock.calls[0][1].method).toBe('PATCH');
    expect(fetch.mock.calls[1][1].method).toBe('PUT');
    expect(fetch.mock.calls[2][1].method).toBe('DELETE');
  });
});
