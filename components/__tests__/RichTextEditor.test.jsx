import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RichTextDisplay } from '../RichTextEditor';

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => null),
  EditorContent: () => <div data-testid="editor-content" />,
}));

vi.mock('@tiptap/starter-kit', () => ({ default: {} }));

describe('RichTextDisplay', () => {
  it('returns null for falsy value', () => {
    const { container } = render(<RichTextDisplay value="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders HTML content via dangerouslySetInnerHTML', () => {
    render(<RichTextDisplay value="<p>Hello <strong>world</strong></p>" />);
    expect(screen.getByText('world')).toBeInTheDocument();
  });

  it('renders plain text as a paragraph', () => {
    render(<RichTextDisplay value="Just plain text" />);
    expect(screen.getByText('Just plain text')).toBeInTheDocument();
  });

  it('converts numbered lines to an ordered list', () => {
    const { container } = render(<RichTextDisplay value={'1. First\n2. Second'} />);
    const ol = container.querySelector('ol');
    expect(ol).not.toBeNull();
    expect(ol.querySelectorAll('li')).toHaveLength(2);
    expect(ol.querySelector('li').textContent).toBe('First');
  });

  it('converts bullet lines to an unordered list', () => {
    const { container } = render(<RichTextDisplay value={'- Alpha\n- Beta\n• Gamma'} />);
    const ul = container.querySelector('ul');
    expect(ul).not.toBeNull();
    expect(ul.querySelectorAll('li')).toHaveLength(3);
  });

  it('flushes list when an empty line separates blocks', () => {
    const { container } = render(<RichTextDisplay value={'1. First\n\nPlain line'} />);
    expect(container.querySelector('ol')).not.toBeNull();
    expect(screen.getByText('Plain line')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<RichTextDisplay value="text" className="custom-class" />);
    expect(container.firstChild.className).toContain('custom-class');
  });

  it('applies inline style', () => {
    const { container } = render(<RichTextDisplay value="text" style={{ color: 'red' }} />);
    expect(container.firstChild.style.color).toBe('red');
  });
});

describe('RichTextEditor', () => {
  it('returns null when editor is not yet initialised', async () => {
    const { default: RichTextEditor } = await import('../RichTextEditor');
    const { container } = render(<RichTextEditor value="" onChange={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
