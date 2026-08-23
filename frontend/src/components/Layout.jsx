import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const LANDLORD_LINKS = [
  { to: '/properties', icon: 'bi-buildings', label: 'Properties' },
  { to: '/applications', icon: 'bi-clipboard-check', label: 'Applications' },
  { to: '/leases', icon: 'bi-file-earmark-text', label: 'Leases' },
  { to: '/rent-dashboard', icon: 'bi-cash-stack', label: 'Rent' },
  { to: '/maintenance-board', icon: 'bi-tools', label: 'Maintenance' },
  { to: '/reports', icon: 'bi-graph-up-arrow', label: 'Reports' },
];

const TENANT_LINKS = [
  { to: '/browse', icon: 'bi-search', label: 'Browse Units' },
  { to: '/my-lease', icon: 'bi-file-earmark-text', label: 'My Lease' },
  { to: '/rent-history', icon: 'bi-cash-coin', label: 'Rent History' },
  { to: '/my-maintenance', icon: 'bi-tools', label: 'Maintenance' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'landlord' ? LANDLORD_LINKS : TENANT_LINKS;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg app-navbar sticky-top">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center gap-2 text-white fw-bold" to="/dashboard">
            <span className="brand-icon-badge"><i className="bi bi-house-heart-fill" /></span>
            Rentora
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav mx-lg-auto my-2 my-lg-0 gap-lg-1 flex-wrap">
              <li className="nav-item">
                <NavLink className="nav-link" to="/dashboard">
                  <i className="bi bi-speedometer2 me-1" />Dashboard
                </NavLink>
              </li>
              {links.map(link => (
                <li className="nav-item" key={link.to}>
                  <NavLink className="nav-link" to={link.to}>
                    <i className={`bi ${link.icon} me-1`} />{link.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="d-flex align-items-center gap-3 ms-lg-auto">
              <div className="text-white">
                <NotificationBell />
              </div>
              <div className="dropdown">
                <button
                  className="btn btn-sm btn-light d-flex align-items-center gap-2 rounded-pill px-2 py-1"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle text-white fw-semibold"
                    style={{ width: '1.7rem', height: '1.7rem', background: 'var(--brand)', fontSize: '.8rem' }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                  <span className="d-none d-md-inline small fw-semibold text-dark">{user?.name}</span>
                  <i className="bi bi-chevron-down small text-muted" />
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <h6 className="dropdown-header">{user?.email}</h6>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" type="button" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2" />Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-4">
        {children}
      </main>

      <footer className="container py-4 text-center text-muted small border-top">
        <i className="bi bi-house-heart me-1 text-primary" />
        Rentora — Rental Management Platform
      </footer>
    </>
  );
}
