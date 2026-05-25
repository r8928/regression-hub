import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import theme from '@/app/theme';
import SummaryRow from '../SummaryRow';

function renderRow(props) {
  return render(
    <ThemeProvider theme={theme}>
      <SummaryRow {...props} />
    </ThemeProvider>,
  );
}

describe('SummaryRow', () => {
  it('renders the name and pass/fail/pending counts', () => {
    renderRow({ name: 'Auth', passed: 5, failed: 2, pending: 3, total: 10 });
    expect(screen.getByText('Auth')).toBeInTheDocument();
    expect(screen.getByText(/5 Pass/)).toBeInTheDocument();
    expect(screen.getByText(/2 Fail/)).toBeInTheDocument();
    expect(screen.getByText(/3 Pending/)).toBeInTheDocument();
  });

  it('renders "Unassigned" when no name is provided', () => {
    renderRow({ passed: 0, failed: 0, pending: 0, total: 0 });
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('renders the recharts container for the stacked bar', () => {
    const { container } = renderRow({
      name: 'x',
      passed: 5,
      failed: 0,
      pending: 5,
      total: 10,
    });
    // ResponsiveContainer always renders its wrapper div in jsdom (SVG is not
    // painted without real layout dimensions)
    expect(
      container.querySelector('.recharts-responsive-container'),
    ).toBeInTheDocument();
  });

  it('does not crash when total is 0', () => {
    expect(() =>
      renderRow({ name: 'x', passed: 0, failed: 0, pending: 0, total: 0 }),
    ).not.toThrow();
  });
});
