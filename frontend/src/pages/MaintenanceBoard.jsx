import { useCallback, useEffect, useState } from 'react';
import { getRequestsForLandlord, updateRequestStatus } from '../api/maintenance';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['open', 'in_progress', 'resolved'];

export default function MaintenanceBoard() {
  const [requests, setRequests] = useState([]);

  const load = useCallback(() => {
    getRequestsForLandlord().then(res => setRequests(res.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(id, status) {
    await updateRequestStatus(id, status);
    load();
  }

  const open = requests.filter(r => r.status === 'open').length;
  const inProgress = requests.filter(r => r.status === 'in_progress').length;
  const resolved = requests.filter(r => r.status === 'resolved').length;

  return (
    <>
      <PageHeader
        icon="bi-tools"
        title="Maintenance Board"
        subtitle="Track and update tenant requests"
      />

      <div className="row row-cols-3 g-3 mb-4">
        <div className="col"><div className="card card-hover h-100"><div className="card-body py-3">
          <div className="stat-label">Open</div>
          <div className="stat-value text-danger">{open}</div>
        </div></div></div>
        <div className="col"><div className="card card-hover h-100"><div className="card-body py-3">
          <div className="stat-label">In progress</div>
          <div className="stat-value" style={{ color: 'var(--brand)' }}>{inProgress}</div>
        </div></div></div>
        <div className="col"><div className="card card-hover h-100"><div className="card-body py-3">
          <div className="stat-label">Resolved</div>
          <div className="stat-value text-success">{resolved}</div>
        </div></div></div>
      </div>

      {requests.length === 0 ? (
        <div className="card"><div className="card-body empty-state">
          <i className="bi bi-inbox" />
          No maintenance requests from tenants.
        </div></div>
      ) : (
        requests.map(r => (
          <div className="card card-hover mb-3" key={r.id}>
            <div className="card-body p-3 p-md-4">
              <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
                <h2 className="h6 fw-bold mb-0">{r.title}</h2>
                <StatusBadge value={r.status} />
              </div>

              <p className="text-muted mb-2">{r.description}</p>

              <div className="d-flex flex-wrap align-items-center gap-3 small text-muted mb-3">
                <span><i className="bi bi-door-open me-1" />Unit #{r.unit.unitNumber} · {r.unit.property.name}</span>
                <span><i className="bi bi-person me-1" />{r.tenant.name}</span>
                <span><StatusBadge value={r.priority} /></span>
              </div>

              <label className="form-label small fw-semibold text-muted mb-1 d-block">
                Update status
              </label>
              <select
                className="form-select form-select-sm"
                style={{ maxWidth: '220px' }}
                value={r.status}
                onChange={e => handleStatusChange(r.id, e.target.value)}
                aria-label={`Update status for ${r.title}`}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
        ))
      )}
    </>
  );
}
