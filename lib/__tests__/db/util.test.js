import { toClientDoc } from '@/lib/db/util';
import { describe, expect, it } from 'vitest';

describe('toClientDoc', () => {
  it('converts _id to string and preserves other fields', () => {
    const doc = { _id: { toString: () => 'abc123' }, name: 'Test' };
    expect(toClientDoc(doc)).toEqual({ _id: 'abc123', name: 'Test' });
  });

  it('stringifies string _id', () => {
    expect(toClientDoc({ _id: 'already', x: 1 })).toEqual({
      _id: 'already',
      x: 1,
    });
  });
});
