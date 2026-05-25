import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import theme from '@/app/theme';
import EmptyState from '../EmptyState';

function Wrapper({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

describe('EmptyState', () => {
  it('renders children as inline text-only empty state (no icon, no title)', () => {
    render(
      <Wrapper>
        <EmptyState>No data yet</EmptyState>
      </Wrapper>,
    );
    expect(screen.getByText('No data yet')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders icon + title + children when all are provided', () => {
    render(
      <Wrapper>
        <EmptyState
          icon={<InfoOutlined data-testid='empty-icon' />}
          title='Nothing here'
        >
          <p>Import something.</p>
        </EmptyState>
      </Wrapper>,
    );
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    // Typography variant emptyStateTitle maps to a <p> element
    expect(screen.getByText('Nothing here').tagName).toBe('P');
    expect(screen.getByText('Import something.')).toBeInTheDocument();
  });

  it('renders title without icon when only title is provided', () => {
    render(
      <Wrapper>
        <EmptyState title='Empty'>
          <p>body</p>
        </EmptyState>
      </Wrapper>,
    );
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-icon')).toBeNull();
  });
});
