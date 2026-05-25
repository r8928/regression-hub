import { z } from 'zod';
import { get, put } from '@/lib/http/client';
import {
  settingsResponseSchema,
  updateSettingsBodySchema,
} from '@/lib/schemas/settings';

const zOkResponse = z.object({ ok: z.literal(true) });

export function getSettings(opts = {}) {
  return get('/api/settings', {
    schema: settingsResponseSchema,
    ...opts,
  });
}

export function putSettings(body, opts = {}) {
  return put('/api/settings', body, {
    schema: zOkResponse,
    ...opts,
  });
}

export { updateSettingsBodySchema };
