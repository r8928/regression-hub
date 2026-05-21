import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PriorityBadge, { priorityBadgeStyle } from '../PriorityBadge';

describe('PriorityBadge', () => {
  it('renders the priority label inside a span', () => {
    render(<PriorityBadge priority="High" />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('falls back to "Medium" label when no priority is given', () => {
    render(<PriorityBadge priority={undefined} />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });
});

describe('priorityBadgeStyle', () => {
  it('returns red palette for High', () => {
    expect(priorityBadgeStyle('High')).toMatchObject({ color: '#dc2626' });
  });

  it('returns yellow palette for Medium', () => {
    expect(priorityBadgeStyle('Medium')).toMatchObject({ color: '#d97706' });
  });

  it('returns green palette for Low', () => {
    expect(priorityBadgeStyle('Low')).toMatchObject({ color: '#16a34a' });
  });

  it('returns empty object for unknown priority', () => {
    expect(priorityBadgeStyle('?')).toEqual({});
  });
});
