import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RichTextDisplay from '@/components/RichTextDisplay';

describe('RichTextDisplay', () => {
  it('returns null when value is empty string', () => {
    const { container } = render(<RichTextDisplay value="" />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when value is undefined', () => {
    const { container } = render(<RichTextDisplay value={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders HTML content via dangerouslySetInnerHTML', () => {
    render(<RichTextDisplay value="<p>Hello <strong>world</strong></p>" />);
    expect(screen.getByText('world')).toBeInTheDocument();
  });

  it('applies rte-display class name', () => {
    const { container } = render(<RichTextDisplay value="<p>hi</p>" />);
    expect(container.firstChild).toHaveClass('rte-display');
  });

  it('appends extra className when provided', () => {
    const { container } = render(<RichTextDisplay value="<p>hi</p>" className="extra" />);
    expect(container.firstChild).toHaveClass('extra');
  });

  it('converts plain-text bullet lines to a <ul>', () => {
    render(<RichTextDisplay value={'- apple\n- banana'} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('converts plain-text numbered lines to an <ol>', () => {
    render(<RichTextDisplay value={'1. first\n2. second'} />);
    const list = screen.getByRole('list');
    expect(list.tagName.toLowerCase()).toBe('ol');
  });

  it('renders plain paragraphs for unformatted text', () => {
    render(<RichTextDisplay value={'hello world'} />);
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });
});
