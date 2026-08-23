import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';

function renderAt(path, allowedRoles) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute allowedRoles={allowedRoles}>
                <div>SECRET CONTENT</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>LOGIN PAGE</div>} />
          <Route path="/dashboard" element={<div>DASHBOARD</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('ProtectedRoute', () => {
  it('redirects anonymous visitors to /login', () => {
    renderAt('/protected');
    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
    expect(screen.queryByText('SECRET CONTENT')).not.toBeInTheDocument();
  });

  it('renders children for an authenticated allowed role', () => {
    localStorage.setItem('user', JSON.stringify({ id: 2, role: 'tenant' }));
    renderAt('/protected', ['tenant', 'landlord']);
    expect(screen.getByText('SECRET CONTENT')).toBeInTheDocument();
  });

  it('bounces a wrong-role user to /dashboard instead of showing content', () => {
    localStorage.setItem('user', JSON.stringify({ id: 2, role: 'tenant' }));
    renderAt('/protected', ['landlord']);
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
    expect(screen.queryByText('SECRET CONTENT')).not.toBeInTheDocument();
  });
});
