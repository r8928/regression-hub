import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SummaryRow from '../SummaryRow';

describe('SummaryRow', () => {
  it('renders the name and pass/fail/pending counts', () => {
    render(
      <SummaryRow name='Auth' passed={5} failed={2} pending={3} total={10} />,
    );
    expect(screen.getByText('Auth')).toBeInTheDocument();
    expect(screen.getByText(/5 Pass/)).toBeInTheDocument();
    expect(screen.getByText(/2 Fail/)).toBeInTheDocument();
    expect(screen.getByText(/3 Pending/)).toBeInTheDocument();
  });

  it('renders a progress-bar fill at passed/total width', () => {
    const { container } = render(
      <SummaryRow name='x' passed={5} failed={0} pending={5} total={10} />,
    );
    const fill = container.querySelector('.progress-bar-fill');
    expect(fill.style.width).toBe('50%');
  });

  it('renders fill at 0% when total is 0', () => {
    const { container } = render(
      <SummaryRow name='x' passed={0} failed={0} pending={0} total={0} />,
    );
    const fill = container.querySelector('.progress-bar-fill');
    expect(fill.style.width).toBe('0%');
  });
});
