import { Fragment } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { getMyLeases } from '../api/leases';
import { createRequest, getMyRequests } from '../api/maintenance';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

const PRIORITY_ICON = { low: 'bi-droplet', medium: 'bi-exclamation-triangle', high: 'bi-fire' };

export default function MyMaintenance() {
  const [leases, setLeases] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ unitId: '', title: '', description: '', priority: 'medium' });
  const [error, setError] = useState('');

  const load = useCallback(() => {
    Promise.all([getMyLeases(), getMyRequests()]).then(([leasesRes, requestsRes]) => {
      setLeases(leasesRes.data.filter(l => l.status === 'active'));
      setRequests(requestsRes.data);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await createRequest(form);
      setForm({ unitId: '', title: '', description: '', priority: 'medium' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request');
    }
  }

  return (
    <>
      <PageHeader
        icon="bi-tools"
        title="Maintenance Requests"
        subtitle="Report issues and follow their progress"
      />

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card sticky-lg-top" style={{ top: '90px' }}>
            <div className="card-header d-flex align-items-center gap-2 py-3">
              <i className="bi bi-plus-circle text-primary" />
              New request
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small" role="alert">
                  <i className="bi bi-exclamation-circle-fill" />
                  <div>{error}</div>
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="reqUnit" className="form-label small fw-semibold">Unit</label>
                  <select id="reqUnit" className="form-select" value={form.unitId}
                    onChange={e => setForm({ ...form, unitId: e.target.value })} required>
                    <option value="">Select your unit…</option>
                    {leases.map(l => (
                      <option key={l.unit.id} value={l.unit.id}>
                        {l.unit.property.name} — Unit #{l.unit.unitNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="reqTitle" className="form-label small fw-semibold">Title</label>
                  <input id="reqTitle" className="form-control" placeholder="e.g. Leaking kitchen faucet"
                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="reqDesc" className="form-label small fw-semibold">Description</label>
                  <textarea id="reqDesc" className="form-control" rows={4}
                    placeholder="Describe the issue in detail…"
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-semibold d-block">Priority</label>
                  <div className="btn-group w-100" role="group" aria-label="Priority">
                    {[['low', 'Low'], ['medium', 'Medium'], ['high', 'High']].map(([value, label]) => (
                      <Fragment key={value}>
                        <input type="radio" className="btn-check" name="priority" id={`prio-${value}`}
                          value={value} checked={form.priority === value}
                          onChange={e => setForm({ ...form, priority: e.target.value })} />
                        <label className="btn btn-outline-primary" htmlFor={`prio-${value}`}>
                          <i className={`bi ${PRIORITY_ICON[value]} me-1`} />{label}
                        </label>
                      </Fragment>
                    ))}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold">
                  <i className="bi bi-send me-2" />Submit Request
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <h2 className="h6 text-muted text-uppercase fw-semibold mb-3">
            My Requests ({requests.length})
          </h2>

          {requests.length === 0 ? (
            <div className="card"><div className="card-body empty-state">
              <i className="bi bi-tools" />
              No requests yet — submit one using the form.
            </div></div>
          ) : (
            requests.map(r => (
              <div className="card card-hover mb-3" key={r.id}>
                <div className="card-body p-3 p-md-4">
                  <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
                    <h3 className="h6 fw-bold mb-0">{r.title}</h3>
                    <StatusBadge value={r.status} />
                  </div>
                  <p className="text-muted mb-2">{r.description}</p>
                  <div className="d-flex flex-wrap gap-3 align-items-center small text-muted">
                    <span><i className="bi bi-door-open me-1" />Unit #{r.unit.unitNumber} · {r.unit.property.name}</span>
                    <span><StatusBadge value={r.priority} /></span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
