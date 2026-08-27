import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../api/axios', () => ({
  default: { post: vi.fn(), get: vi.fn().mockResolvedValue({}) },
}));

import api from '../api/axios';

function Probe() {
  const { user, login, logout, register } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <button onClick={() => login('james@test.com', 'pw')}>do-login</button>
      <button onClick={() => register('Jane', 'jane@test.com', 'pw', 'tenant')}>do-register</button>
      <button onClick={() => logout()}>do-logout</button>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthContext', () => {
  it('login stores token + user and exposes the user', async () => {
    api.post.mockResolvedValueOnce({
      data: { token: 'tok-123', user: { id: 2, email: 'james@test.com', role: 'tenant' } },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await userEvent.click(screen.getByText('do-login'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('james@test.com'));
    expect(localStorage.getItem('token')).toBe('tok-123');
    expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({ id: 2, role: 'tenant' });
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'james@test.com', password: 'pw' });
  });

  it('logout clears storage and the user', async () => {
    localStorage.setItem('token', 'tok-old');
    localStorage.setItem('user', JSON.stringify({ id: 2, email: 'james@test.com' }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    expect(screen.getByTestId('user')).toHaveTextContent('james@test.com');

    await userEvent.click(screen.getByText('do-logout'));

    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('register posts the payload without signing the user in', async () => {
    api.post.mockResolvedValueOnce({ data: { id: 9 } });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await userEvent.click(screen.getByText('do-register'));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Jane',
        email: 'jane@test.com',
        password: 'pw',
        role: 'tenant',
      })
    );
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
