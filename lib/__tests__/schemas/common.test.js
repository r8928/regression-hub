import { describe, expect, it } from 'vitest';
import {
  coerceQueryString,
  objectIdString,
  paginationDefaults,
  parsePagination,
} from '@/lib/schemas/common';

describe('common schemas', () => {
  it('objectIdString rejects empty', () => {
    expect(objectIdString.safeParse('').success).toBe(false);
    expect(objectIdString.safeParse('abc').success).toBe(true);
  });

  it('parsePagination applies defaults and caps', () => {
    const params = new URLSearchParams({ page: '2', limit: '999' });
    const { page, limit, skip } = parsePagination(params, { maxLimit: 200 });
    expect(page).toBe(2);
    expect(limit).toBe(200);
    expect(skip).toBe(200);
  });

  it('paginationDefaults validates shape', () => {
    expect(
      paginationDefaults.safeParse({
        page: 1,
        limit: 50,
        total: 10,
        totalPages: 1,
      }).success,
    ).toBe(true);
  });

  it('coerceQueryString stringifies values', () => {
    expect(coerceQueryString(null)).toBe('');
    expect(coerceQueryString(42)).toBe('42');
  });
});
