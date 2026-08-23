import { useCallback, useEffect, useState } from 'react';
import { getApplicationsForLandlord, updateApplicationStatus } from '../api/applications';
import { createLease } from '../api/leases';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [leaseForm, setLeaseForm] = useState({});
  const [error, setError] = useState('');

  const load = useCallback(() => {
    getApplicationsForLandlord().then(res => setApplications(res.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDecision(id, status) {
    await updateApplicationStatus(id, status);
    load();
  }

  function updateLeaseForm(applicationId, field, value) {
    setLeaseForm({
      ...leaseForm,
      [applicationId]: { ...(leaseForm[applicationId] || {}), [field]: value },
    });
  }

  async function handleCreateLease(applicationId) {
    setError('');
    const form = leaseForm[applicationId] || {};
    try {
      await createLease({
        applicationId,
        startDate: form.startDate,
        endDate: form.endDate,
        monthlyRent: form.monthlyRent,
      });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create lease');
    }
  }

  return (
    <>
      <PageHeader
        icon="bi-clipboard-check"
        title="Applications"
        subtitle={`${applications.filter(a => a.status === 'pending').length} pending review`}
      />

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small" role="alert">
          <i className="bi bi-exclamation-circle-fill" />
          <div>{error}</div>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="card"><div className="card-body empty-state">
          <i className="bi bi-inbox" />
          No applications received yet.
        </div></div>
      ) : (
        applications.map(app => (
          <div className="card card-hover mb-3" key={app.id}>
            <div className="card-body p-3 p-md-4">
              <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
                <div className="d-flex align-items-center gap-3">
                  <span
                    className="d-inline-flex align-items-center justify-content-center rounded-circle text-white fw-semibold flex-shrink-0"
                    style={{ width: '2.6rem', height: '2.6rem', background: 'var(--brand)', fontSize: '.9rem' }}
                  >
                    {app.tenant.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <span className="fw-bold">{app.tenant.name}</span>
                    <small className="text-muted d-block">{app.tenant.email}</small>
                  </div>
                </div>
                <StatusBadge value={app.status} />
              </div>

              <p className="mb-2 text-muted small">
                <i className="bi bi-door-open me-1" />Unit #{app.unit.unitNumber}
                · <i className="bi bi-building mx-1" />{app.unit.property.name}
              </p>

              {app.message && (
                <blockquote className="blockquote border-start border-3 ps-3 my-3 text-muted small">
                  “{app.message}”
                </blockquote>
              )}

              {app.status === 'pending' && (
                <div className="d-flex gap-2 mt-3 flex-wrap">
                  <button className="btn btn-success btn-sm px-3" onClick={() => handleDecision(app.id, 'approved')}>
                    <i className="bi bi-check-lg me-1" />Approve
                  </button>
                  <button className="btn btn-outline-danger btn-sm px-3" onClick={() => handleDecision(app.id, 'rejected')}>
                    <i className="bi bi-x-lg me-1" />Reject
                  </button>
                </div>
              )}

              {app.status === 'approved' && !app.lease && (
                <form
                  className="mt-3 border-top pt-3"
                  onSubmit={e => { e.preventDefault(); handleCreateLease(app.id); }}
                >
                  <p className="small fw-semibold text-muted mb-2">
                    <i className="bi bi-file-earmark-plus me-1" />Create a lease to finalize
                  </p>
                  <div className="row g-2 align-items-end">
                    <div className="col-md-3 col-6">
                      <label className="form-label small text-muted">Start date</label>
                      <input type="date" className="form-control form-control-sm" required
                        value={leaseForm[app.id]?.startDate || ''}
                        onChange={e => updateLeaseForm(app.id, 'startDate', e.target.value)} />
                    </div>
                    <div className="col-md-3 col-6">
                      <label className="form-label small text-muted">End date</label>
                      <input type="date" className="form-control form-control-sm" required
                        value={leaseForm[app.id]?.endDate || ''}
                        onChange={e => updateLeaseForm(app.id, 'endDate', e.target.value)} />
                    </div>
                    <div className="col-md-3 col-6">
                      <label className="form-label small text-muted">Monthly rent ($)</label>
                      <input type="number" min="0" className="form-control form-control-sm" placeholder="1200" required
                        value={leaseForm[app.id]?.monthlyRent || ''}
                        onChange={e => updateLeaseForm(app.id, 'monthlyRent', e.target.value)} />
                    </div>
                    <div className="col-md-3 col-6">
                      <button type="submit" className="btn btn-primary btn-sm w-100">
                        Create Lease
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {app.lease && (
                <div className="alert alert-success py-2 mt-3 mb-0 small d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill" />
                  Lease created — manage it under <strong>&nbsp;Leases</strong>.
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </>
  );
}
