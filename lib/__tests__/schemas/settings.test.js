import {
  settingsResponseSchema,
  updateSettingsBodySchema,
} from '@/lib/schemas/settings';
import { describe, expect, it } from 'vitest';

describe('settings schemas', () => {
  it('settingsResponseSchema requires qaUsers array', () => {
    expect(settingsResponseSchema.safeParse({ qaUsers: ['A'] }).success).toBe(
      true,
    );
    expect(settingsResponseSchema.safeParse({}).success).toBe(false);
  });

  it('updateSettingsBodySchema is strict', () => {
    expect(
      updateSettingsBodySchema.safeParse({ softwareVersion: '1.0' }).success,
    ).toBe(true);
    expect(updateSettingsBodySchema.safeParse({ extra: true }).success).toBe(
      false,
    );
  });
});
