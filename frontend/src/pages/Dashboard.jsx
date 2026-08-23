import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LANDLORD_CARDS = [
  { to: '/properties', icon: 'bi-buildings', color: '#4f46e5', bg: '#eef2ff', title: 'Manage Properties', desc: 'Add properties, create units and track availability.' },
  { to: '/applications', icon: 'bi-clipboard-check', color: '#059669', bg: '#d1fae5', title: 'Applications', desc: 'Review tenant applications and create leases.' },
  { to: '/leases', icon: 'bi-file-earmark-text', color: '#b45309', bg: '#fef3c7', title: 'Leases', desc: 'Manage active leases, documents and terminations.' },
  { to: '/rent-dashboard', icon: 'bi-cash-stack', color: '#0e7490', bg: '#cffafe', title: 'Rent Dashboard', desc: 'Track rent payments across your portfolio.' },
  { to: '/maintenance-board', icon: 'bi-tools', color: '#dc2626', bg: '#fee2e2', title: 'Maintenance Board', desc: 'Respond to maintenance requests from tenants.' },
  { to: '/reports', icon: 'bi-graph-up-arrow', color: '#7c3aed', bg: '#ede9fe', title: 'Reports', desc: 'Profitability insights for your portfolio.' },
];

const TENANT_CARDS = [
  { to: '/browse', icon: 'bi-search', color: '#4f46e5', bg: '#eef2ff', title: 'Browse Units', desc: 'Find vacant units and apply in minutes.' },
  { to: '/my-lease', icon: 'bi-file-earmark-text', color: '#b45309', bg: '#fef3c7', title: 'My Lease', desc: 'View your lease details and documents.' },
  { to: '/rent-history', icon: 'bi-cash-coin', color: '#0e7490', bg: '#cffafe', title: 'Rent History', desc: 'See upcoming dues and payment history.' },
  { to: '/my-maintenance', icon: 'bi-tools', color: '#dc2626', bg: '#fee2e2', title: 'Maintenance Requests', desc: 'Report issues and follow their progress.' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const cards = user.role === 'landlord' ? LANDLORD_CARDS : TENANT_CARDS;

  return (
    <>
      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <span
          className="page-icon"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
        >
          <i className="bi bi-emoji-smile" />
        </span>
        <div>
          <h1 className="page-title h3 mb-0">Welcome back, {user.name}</h1>
          <p className="page-subtitle mb-0 text-capitalize">Signed in as {user.role} · {user.email}</p>
        </div>
      </div>

      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
        {cards.map(card => (
          <div className="col" key={card.to}>
            <Link to={card.to} className="text-decoration-none">
              <div className="card card-hover quick-link-card h-100">
                <div className="card-body d-flex gap-3 align-items-start p-3 p-md-4">
                  <span
                    className="quick-link-icon flex-shrink-0"
                    style={{ background: card.bg, color: card.color }}
                  >
                    <i className={`bi ${card.icon}`} />
                  </span>
                  <div>
                    <h2 className="h6 fw-bold text-dark mb-1">{card.title}</h2>
                    <p className="text-muted small mb-0">{card.desc}</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
