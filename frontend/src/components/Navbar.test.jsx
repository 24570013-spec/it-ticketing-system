import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

// Mock useAuth
const mockLogout = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout: mockLogout }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

let mockUser = { id: 1, name: 'Alice', email: 'alice@test.com', role: 'user' };

function renderNavbar(user = null) {
  mockUser = user;
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
}

describe('Navbar', () => {
  test('renders user name when available', () => {
    renderNavbar({ id: 1, name: 'Alice', email: 'alice@test.com', role: 'user' });
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  test('renders user email when name is absent', () => {
    renderNavbar({ id: 1, email: 'alice@test.com', role: 'user' });
    expect(screen.getByText('alice@test.com')).toBeInTheDocument();
  });

  test('renders Welcome text with user name', () => {
    renderNavbar({ id: 1, name: 'Alice', role: 'user' });
    expect(screen.getByText(/Welcome,/)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  test('hides Admin Panel link for regular user', () => {
    renderNavbar({ id: 1, name: 'Alice', role: 'user' });
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  test('shows Admin Panel link for admin user', () => {
    renderNavbar({ id: 99, name: 'Admin', role: 'admin' });
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  test('renders Logout button', () => {
    renderNavbar({ id: 1, name: 'Alice', role: 'user' });
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  test('calls logout and navigates to /login on logout click', () => {
    mockLogout.mockClear();
    mockNavigate.mockClear();
    renderNavbar({ id: 1, name: 'Alice', role: 'user' });
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
