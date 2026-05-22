import { vi } from 'vitest';

export function createMockDb() {
  const collections = {};

  const db = {
    collection: vi.fn((name) => {
      if (!collections[name]) {
        collections[name] = {};
      }
      return collections[name];
    }),
  };

  const reset = () => {
    for (const key of Object.keys(collections)) {
      delete collections[key];
    }
    db.collection.mockClear();
  };

  return { db, collections, reset };
}
