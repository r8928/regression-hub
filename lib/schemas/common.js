import { z } from 'zod';

export const objectIdString = z.string().min(1);

export const optionalString = z.string().optional().or(z.literal(''));

export function parsePagination(
  searchParams,
  { defaultLimit = 50, maxLimit = 200 } = {},
) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(
    maxLimit,
    Math.max(
      1,
      parseInt(searchParams.get('limit') || String(defaultLimit), 10),
    ),
  );
  return { page, limit, skip: (page - 1) * limit };
}

export const paginationDefaults = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export function coerceQueryString(value) {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
}
