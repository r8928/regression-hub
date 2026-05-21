import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SessionWrapper from '../SessionWrapper';

vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }) => <>{children}</>,
}));

vi.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }) => <>{children}</>,
}));

vi.mock('@/lib/queryClient', () => ({
  getQueryClient: vi.fn(() => ({})),
}));

describe('SessionWrapper', () => {
  it('renders children', () => {
    render(<SessionWrapper><p>child content</p></SessionWrapper>);
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <SessionWrapper>
        <span>first</span>
        <span>second</span>
      </SessionWrapper>
    );
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });
});
