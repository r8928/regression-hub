import { z } from 'zod';

export const settingsResponseSchema = z
  .object({
    testEnvironment: z.string().optional(),
    softwareVersion: z.string().optional(),
    qaUsers: z.array(z.string()),
  })
  .passthrough();

export const updateSettingsBodySchema = z
  .object({
    testEnvironment: z.string().optional(),
    softwareVersion: z.string().optional(),
  })
  .strict();
