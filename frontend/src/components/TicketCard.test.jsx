import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TicketCard from './TicketCard';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function makeTicket(overrides = {}) {
  return {
    id: 1,
    title: 'Test Ticket',
    priority: 'medium',
    status: 'open',
    created_at: '2024-01-15T09:00:00Z',
    assigned_to_name: null,
    ...overrides,
  };
}

function renderCard(ticket) {
  return render(
    <MemoryRouter>
      <TicketCard ticket={ticket} />
    </MemoryRouter>
  );
}

describe('TicketCard', () => {
  test('renders ticket title', () => {
    renderCard(makeTicket({ title: 'Login page is broken' }));
    expect(screen.getByText('Login page is broken')).toBeInTheDocument();
  });

  test('renders ticket priority', () => {
    renderCard(makeTicket({ priority: 'high' }));
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  test('renders formatted created_at date', () => {
    renderCard(makeTicket({ created_at: '2024-01-15T09:00:00Z' }));
    // Just verify a date string appears (format depends on locale)
    const dateString = new Date('2024-01-15T09:00:00Z').toLocaleDateString();
    expect(screen.getByText(new RegExp(dateString.replace('/', '\\/')))).toBeInTheDocument();
  });

  test('renders StatusBadge with correct status', () => {
    renderCard(makeTicket({ status: 'resolved' }));
    expect(screen.getByText('resolved')).toBeInTheDocument();
  });

  test('renders assigned_to_name when present', () => {
    renderCard(makeTicket({ assigned_to_name: 'Alice' }));
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  test('does not show assignee text when assigned_to_name is null', () => {
    renderCard(makeTicket({ assigned_to_name: null }));
    expect(screen.queryByText(/Assigned:/)).not.toBeInTheDocument();
  });

  test('navigates to ticket detail on click', () => {
    mockNavigate.mockClear();
    renderCard(makeTicket({ id: 42 }));
    fireEvent.click(screen.getByText('Test Ticket').closest('div'));
    expect(mockNavigate).toHaveBeenCalledWith('/tickets/42');
  });

  test('has pointer cursor style', () => {
    const { container } = renderCard(makeTicket());
    const card = container.firstChild;
    expect(card.style.cursor).toBe('pointer');
  });
});
