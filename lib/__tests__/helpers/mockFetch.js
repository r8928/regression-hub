import { vi } from 'vitest';

/**
 * @param {Record<string, { ok?: boolean, status?: number, json?: unknown, text?: string }>} routes
 */
export function mockFetch(routes) {
  return vi.fn(async (url, init = {}) => {
    const key = typeof url === 'string' ? url : url.toString();
    const method = (init.method || 'GET').toUpperCase();
    const routeKey = `${method} ${key}`;
    const entry = routes[routeKey] ?? routes[key];
    if (!entry) {
      throw new Error(`mockFetch: no handler for ${routeKey}`);
    }
    const status = entry.status ?? (entry.ok === false ? 400 : 200);
    const ok = entry.ok ?? (status >= 200 && status < 300);
    return {
      ok,
      status,
      json: async () => entry.json ?? {},
      text: async () => entry.text ?? JSON.stringify(entry.json ?? {}),
    };
  });
}
