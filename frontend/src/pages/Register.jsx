import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'tenant' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/login');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        (err.request ? 'Cannot reach the server. Make sure the backend is running on port 5000.' : 'Registration failed')
      );
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <span className="brand-icon-badge auth-brand-badge mb-3">
              <i className="bi bi-house-add-fill" />
            </span>
            <h1 className="h4 fw-bold mb-1">Create your account</h1>
            <p className="text-muted small mb-0">Join Rentora as a landlord or tenant</p>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small" role="alert">
              <i className="bi bi-exclamation-circle-fill" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="regName" className="form-label small fw-semibold">Full name</label>
              <input
                id="regName"
                name="name"
                className="form-control"
                placeholder="Jane Doe"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="regEmail" className="form-label small fw-semibold">Email address</label>
              <input
                id="regEmail"
                name="email"
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="regPassword" className="form-label small fw-semibold">Password</label>
              <input
                id="regPassword"
                name="password"
                type="password"
                className="form-control"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange}
                minLength={8}
                required
              />
              <div className="form-text">Must be at least 8 characters.</div>
            </div>
            <div className="mb-4">
              <label htmlFor="regRole" className="form-label small fw-semibold">I am a…</label>
              <div className="row g-2">
                <div className="col-6">
                  <input type="radio" className="btn-check" name="role" id="roleTenant" value="tenant" checked={form.role === 'tenant'} onChange={handleChange} />
                  <label className="btn btn-outline-primary w-100" htmlFor="roleTenant">
                    <i className="bi bi-person me-1" />Tenant
                  </label>
                </div>
                <div className="col-6">
                  <input type="radio" className="btn-check" name="role" id="roleLandlord" value="landlord" checked={form.role === 'landlord'} onChange={handleChange} />
                  <label className="btn btn-outline-primary w-100" htmlFor="roleLandlord">
                    <i className="bi bi-building me-1" />Landlord
                  </label>
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold">
              <i className="bi bi-person-plus me-2" />Create account
            </button>
          </form>

          <p className="text-center text-muted small mt-4 mb-0">
            Already registered? <Link to="/login" className="link-primary fw-semibold text-decoration-none">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
