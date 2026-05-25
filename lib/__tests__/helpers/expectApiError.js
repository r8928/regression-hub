import { expect } from 'vitest';
import { ApiError } from '@/lib/errors';

export async function expectApiError(promise, { status, message }) {
  await expect(promise).rejects.toSatisfy((err) => {
    if (!(err instanceof ApiError)) return false;
    if (status !== null && status !== undefined && err.status !== status)
      return false;
    if (message !== null && message !== undefined && err.message !== message)
      return false;
    return true;
  });
}
