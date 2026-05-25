import { z } from 'zod';
import { get } from '@/lib/http/client';

const exportRowSchema = z.object({ _id: z.string() }).passthrough();

export function exportData(query = {}, opts = {}) {
  return get('/api/export-data', {
    params: query,
    schema: z.array(exportRowSchema),
    ...opts,
  });
}
