import { ApiError } from '@/lib/errors';
import { describe, expect, it } from 'vitest';

describe('ApiError', () => {
  it('extends Error with name, status, and default null payload', () => {
    const err = new ApiError(404, 'Not found');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe('ApiError');
    expect(err.status).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.payload).toBeNull();
  });

  it('stores optional payload', () => {
    const payload = { error: 'validation', fields: { name: 'required' } };
    const err = new ApiError(400, 'validation', payload);
    expect(err.payload).toEqual(payload);
  });
});
