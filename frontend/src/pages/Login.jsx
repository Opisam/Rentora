import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (err.request ? 'Cannot reach the server. Make sure the backend is running on port 5000.' : 'Login failed')
      );
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <span className="brand-icon-badge auth-brand-badge mb-3">
              <i className="bi bi-house-heart-fill" />
            </span>
            <h1 className="h4 fw-bold mb-1">Welcome back</h1>
            <p className="text-muted small mb-0">Sign in to your Rentora account</p>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small" role="alert">
              <i className="bi bi-exclamation-circle-fill" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="loginEmail" className="form-label small fw-semibold">Email address</label>
              <input
                id="loginEmail"
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="loginPassword" className="form-label small fw-semibold">Password</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-lock" /></span>
                <input
                  id="loginPassword"
                  type="password"
                  className="form-control"
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold">
              <i className="bi bi-box-arrow-in-right me-2" />Sign in
            </button>
          </form>

          <p className="text-center text-muted small mt-4 mb-0">
            No account yet? <Link to="/register" className="link-primary fw-semibold text-decoration-none">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
