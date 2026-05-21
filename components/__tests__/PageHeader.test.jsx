import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageHeader from '../PageHeader';

describe('PageHeader', () => {
  it('renders eyebrow, title and sub', () => {
    render(<PageHeader eyebrow="Data Grid" title="Test Cases" sub="123 rows" />);
    expect(screen.getByText('Data Grid')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Test Cases' })).toBeInTheDocument();
    expect(screen.getByText('123 rows')).toBeInTheDocument();
  });

  it('renders an actions slot beside the header when provided', () => {
    render(<PageHeader title="x" sub="y" actions={<button>New</button>} />);
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
  });

  it('omits the eyebrow if not provided', () => {
    const { container } = render(<PageHeader title="x" sub="y" />);
    expect(container.querySelector('.page-eyebrow')).toBeNull();
  });
});
