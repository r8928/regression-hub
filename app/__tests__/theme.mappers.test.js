import { describe, expect, it } from 'vitest';
import {
  locationToChipColor,
  priorityToColor,
  roleToChipColor,
} from '@/app/theme';
import { PRIORITIES, ROLES, TEAMS } from '@/lib/constants';

describe('priorityToColor', () => {
  it('maps High to error', () => {
    expect(priorityToColor(PRIORITIES.HIGH)).toBe('error');
  });

  it('maps Medium to warning', () => {
    expect(priorityToColor(PRIORITIES.MEDIUM)).toBe('warning');
  });

  it('maps Low to success', () => {
    expect(priorityToColor(PRIORITIES.LOW)).toBe('success');
  });

  it('returns warning for null (fallback)', () => {
    expect(priorityToColor(null)).toBe('warning');
  });

  it('returns warning for undefined (fallback)', () => {
    expect(priorityToColor(undefined)).toBe('warning');
  });

  it('returns warning for an unknown string (fallback)', () => {
    expect(priorityToColor('Critical')).toBe('warning');
  });
});

describe('roleToChipColor', () => {
  it('maps ROLES.ADMIN to primary', () => {
    expect(roleToChipColor(ROLES.ADMIN)).toBe('primary');
  });

  it('maps ROLES.QA to secondary', () => {
    expect(roleToChipColor(ROLES.QA)).toBe('secondary');
  });

  it('returns secondary for null (fallback)', () => {
    expect(roleToChipColor(null)).toBe('secondary');
  });

  it('returns secondary for undefined (fallback)', () => {
    expect(roleToChipColor(undefined)).toBe('secondary');
  });

  it('returns secondary for unknown role (fallback)', () => {
    expect(roleToChipColor('superuser')).toBe('secondary');
  });
});

describe('locationToChipColor', () => {
  it('maps TEAMS.RADIUS to primary', () => {
    expect(locationToChipColor(TEAMS.RADIUS)).toBe('primary');
  });

  it('maps TEAMS.CB to secondary', () => {
    expect(locationToChipColor(TEAMS.CB)).toBe('secondary');
  });

  it('returns primary for null (fallback)', () => {
    expect(locationToChipColor(null)).toBe('primary');
  });

  it('returns primary for undefined (fallback)', () => {
    expect(locationToChipColor(undefined)).toBe('primary');
  });

  it('returns primary for unknown teamId (fallback)', () => {
    expect(locationToChipColor('unknown-team')).toBe('primary');
  });
});
