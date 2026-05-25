export const STATUS = Object.freeze({
  PASS: 'Pass',
  FAIL: 'Fail',
  PENDING: 'Pending',
});

export const COMPLETED_STATUSES = Object.freeze([STATUS.PASS, STATUS.FAIL]);

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  QA: 'qa',
});

export const ALL_ROLES = Object.freeze([ROLES.ADMIN, ROLES.QA]);

export const PRIORITIES = Object.freeze({
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
});

export const PRIORITY_DEFAULT = PRIORITIES.MEDIUM;

export const ASSIGNMENT_STATUS = Object.freeze({
  ACTIVE: 'active',
});

export const UNASSIGNED_SENTINEL = '__unassigned__';

export const CONFIRM_TOKENS = Object.freeze({
  RESET: 'RESET',
});

export const TEAMS = Object.freeze({
  RADIUS: 'radius',
  CB: 'cb',
});
