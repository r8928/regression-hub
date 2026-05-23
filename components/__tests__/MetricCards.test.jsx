import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricCards from '../MetricCards';

const CARDS = [
  { label: 'Total', value: 42 },
  { label: 'Passed', value: 30, cls: 'pass' },
  { label: 'Failed', value: 12, cls: 'fail' },
];

describe('MetricCards', () => {
  it('renders one metric-card per item with correct label and value', () => {
    render(<MetricCards cards={CARDS} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Passed')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('renders — for every value when loading is true', () => {
    render(<MetricCards cards={CARDS} loading />);
    const dashes = screen.getAllByText('—');
    expect(dashes).toHaveLength(CARDS.length);
  });

  it('renders a metric-sub element when sub is provided', () => {
    const cards = [{ label: 'Total', value: 10, sub: 'All imported' }];
    render(<MetricCards cards={cards} />);
    expect(screen.getByText('All imported')).toBeInTheDocument();
  });

  it('applies cls as extra className on the card element', () => {
    const { container } = render(
      <MetricCards cards={[{ label: 'x', value: 1, cls: 'pass' }]} />,
    );
    expect(container.querySelector('.metric-card.pass')).toBeTruthy();
  });
});
