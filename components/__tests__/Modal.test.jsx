import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal', () => {
  it('renders the title and children', () => {
    render(
      <Modal title='Edit User' onClose={() => {}}>
        Body content
      </Modal>,
    );
    expect(
      screen.getByRole('heading', { name: 'Edit User' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('calls onClose when the × button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal title='x' onClose={onClose}>
        body
      </Modal>,
    );
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal title='x' onClose={onClose}>
        body
      </Modal>,
    );
    fireEvent.click(container.firstChild);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT close when the card itself is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal title='x' onClose={onClose}>
        body
      </Modal>,
    );
    fireEvent.click(screen.getByText('body'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('honors maxWidth and zIndex props', () => {
    const { container } = render(
      <Modal title='x' onClose={() => {}} maxWidth={800} zIndex={1500}>
        b
      </Modal>,
    );
    expect(container.firstChild.style.zIndex).toBe('1500');
    expect(container.firstChild.firstChild.style.maxWidth).toBe('800px');
  });
});
