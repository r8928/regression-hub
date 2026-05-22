import { z } from 'zod';

export const bulkUpdateBodySchema = z.object({
  ids: z.array(z.string()).optional(),
  filter: z.object({
    applicationId: z.string().optional(),
    moduleId: z.string().optional(),
    testedBy: z.string().optional(),
    version: z.string().optional(),
  }).optional(),
  fields: z.record(z.unknown()),
  pendingOnly: z.boolean().optional(),
}).refine(
  (data) => (data.ids?.length || data.filter) && data.fields,
  { message: 'ids or filter, and fields are required' },
);

export const bulkUpdateResponseSchema = z.object({
  ok: z.literal(true),
  updated: z.number(),
});
