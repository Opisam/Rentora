import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import Login from './Login';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../api/axios', () => ({
  default: { post: vi.fn() },
}));

import api from '../api/axios';

function LocationProbe() {
  const location = useLocation();
  return <div>LOGIN PAGE ({location.pathname})</div>;
}

function renderLogin(initialPath = '/login') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<div>REGISTER PAGE</div>} />
          <Route path="/dashboard" element={<div>DASHBOARD</div>} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Login page', () => {
  it('renders email + password fields and a register link', () => {
    renderLogin();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByText('Create one')).toBeInTheDocument();
  });

  it('logs in and navigates to the dashboard on success', async () => {
    api.post.mockResolvedValueOnce({
      data: { token: 'tok', user: { id: 2, role: 'tenant' } },
    });

    renderLogin();

    await userEvent.type(screen.getByLabelText(/Email address/i), 'tenant@demo.com');
    await userEvent.type(screen.getByLabelText(/Password/i), 'Demo1234!');
    await userEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(await screen.findByText('DASHBOARD')).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'tenant@demo.com',
      password: 'Demo1234!',
    });
  });

  it('shows the API error message on failure', async () => {
    api.post.mockRejectedValueOnce({
      response: { status: 401, data: { error: 'Invalid email or password' } },
    });

    renderLogin();

    await userEvent.type(screen.getByLabelText(/Email address/i), 'tenant@demo.com');
    await userEvent.type(screen.getByLabelText(/Password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(screen.queryByText('DASHBOARD')).not.toBeInTheDocument();
  });

  it('shows a connectivity hint when the backend is unreachable', async () => {
    api.post.mockRejectedValueOnce({ request: {} });

    renderLogin();

    await userEvent.type(screen.getByLabelText(/Email address/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/Password/i), 'pw');
    await userEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(await screen.findByText(/Cannot reach the server/i)).toBeInTheDocument();
  });
});
