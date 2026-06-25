import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

const VALID_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

describe('StatusBadge', () => {
  test('renders open status with correct text', () => {
    render(<StatusBadge status="open" />);
    expect(screen.getByText('open')).toBeInTheDocument();
  });

  test('renders in_progress with underscore replaced by space', () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText('in progress')).toBeInTheDocument();
  });

  test('renders resolved status', () => {
    render(<StatusBadge status="resolved" />);
    expect(screen.getByText('resolved')).toBeInTheDocument();
  });

  test('renders closed status', () => {
    render(<StatusBadge status="closed" />);
    expect(screen.getByText('closed')).toBeInTheDocument();
  });

  test('renders a <span> element', () => {
    const { container } = render(<StatusBadge status="open" />);
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  test('open status has blue color style', () => {
    const { container } = render(<StatusBadge status="open" />);
    const span = container.querySelector('span');
    expect(span.style.color).toBe('rgb(29, 78, 216)');
  });

  test('resolved status has green color style', () => {
    const { container } = render(<StatusBadge status="resolved" />);
    const span = container.querySelector('span');
    expect(span.style.color).toBe('rgb(21, 128, 61)');
  });

  test('closed status has grey color style', () => {
    const { container } = render(<StatusBadge status="closed" />);
    const span = container.querySelector('span');
    expect(span.style.color).toBe('rgb(107, 114, 128)');
  });

  test('unknown status falls back to grey', () => {
    const { container } = render(<StatusBadge status="unknown_status" />);
    const span = container.querySelector('span');
    expect(span.style.color).toBe('rgb(107, 114, 128)');
  });

  test('all valid statuses render without crashing', () => {
    VALID_STATUSES.forEach(status => {
      const { unmount } = render(<StatusBadge status={status} />);
      unmount();
    });
  });
});
