import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

const mockUseAuth = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const sampleUser: AuthUser = {
  idUsuario: 1,
  nombre: 'Test',
  nickname: null,
  email: 'test@example.com',
  telefono: null,
  estado: 'activo',
  globalRoles: ['jugador'],
  rolesAsignados: [],
};

function renderProtected(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <p>Private content</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('shows a loading status while auth is resolving', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    renderProtected();
    expect(screen.getByRole('status')).toHaveTextContent(/cargando sesión/i);
    expect(screen.queryByText('Private content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to login with return path', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    renderProtected('/dashboard?tab=1');
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Private content')).not.toBeInTheDocument();
  });

  it('renders children when the user is authenticated', () => {
    mockUseAuth.mockReturnValue({ user: sampleUser, loading: false });
    renderProtected();
    expect(screen.getByText('Private content')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});
