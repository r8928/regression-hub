import { z } from 'zod';
import { objectIdString } from '@/lib/schemas/common';

export const createModuleBodySchema = z.object({
  name: z.string().min(1),
  applicationId: objectIdString,
});

export const moduleSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    applicationId: z.string().optional(),
    applicationName: z.string().optional(),
    teamId: z.string().optional(),
  })
  .passthrough();

export const modulesListSchema = z.array(moduleSchema);
