import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders children as inline text-only empty state', () => {
    render(<EmptyState>No data yet</EmptyState>);
    expect(screen.getByText('No data yet')).toBeInTheDocument();
  });

  it('renders icon + title + children when icon and title are provided', () => {
    render(<EmptyState icon="📭" title="Nothing here"><p>Import something.</p></EmptyState>);
    expect(screen.getByText('📭')).toBeInTheDocument();
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Import something.')).toBeInTheDocument();
  });

  it('renders title without icon when only title is provided', () => {
    render(<EmptyState title="Empty"><p>body</p></EmptyState>);
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.queryByText('📭')).toBeNull();
  });
});
