import { z } from 'zod';
import { objectIdString } from '@/lib/schemas/common';

export const testCaseSchema = z.object({
  _id: z.string(),
}).passthrough();

export const testCasesListResponseSchema = z.object({
  data: z.array(testCaseSchema),
  total: z.number(),
  page: z.number(),
  totalPages: z.number(),
  applications: z.array(z.object({ _id: z.string(), name: z.string() })).optional(),
  modules: z.array(z.object({
    _id: z.string(),
    name: z.string(),
    applicationId: z.string(),
  })).optional(),
});

export const createTestCaseBodySchema = z.object({
  applicationId: objectIdString,
  moduleId: objectIdString,
  applicationName: z.string().optional(),
  moduleName: z.string().optional(),
}).passthrough();

export const updateTestCaseBodySchema = z.object({}).passthrough();

export const createTestCaseResponseSchema = z.object({
  ok: z.literal(true),
  id: z.string(),
});

export const okResponseSchema = z.object({ ok: z.literal(true) });

export const resetTeamBodySchema = z.object({
  confirm: z.literal('RESET'),
});

export const resetTeamResponseSchema = z.object({
  ok: z.literal(true),
  deleted: z.object({
    testCases: z.number(),
    testRuns: z.number(),
    modules: z.number(),
    applications: z.number(),
    assignments: z.number(),
  }),
});
