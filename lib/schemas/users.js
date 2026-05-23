import { ALL_ROLES } from '@/lib/constants';
import { z } from 'zod';

export const createUserBodySchema = z.object({
  name: z.string(),
  username: z.string(),
  password: z.string(),
  role: z.enum(ALL_ROLES),
});

export const updateUserBodySchema = z
  .object({
    name: z.string().optional(),
    role: z.enum(ALL_ROLES).optional(),
    active: z.boolean().optional(),
    password: z.string().optional(),
  })
  .strict();

export const userSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    username: z.string(),
    role: z.string(),
  })
  .passthrough();

export const usersListSchema = z.array(userSchema);
