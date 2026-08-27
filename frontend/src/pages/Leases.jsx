import { useCallback, useEffect, useState } from 'react';
import { getLeasesForLandlord, terminateLease } from '../api/leases';
import { uploadDocument, getDocumentsForLease } from '../api/documents';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

export default function Leases() {
  const [leases, setLeases] = useState([]);
  const [documents, setDocuments] = useState({});
  const [files, setFiles] = useState({});

  const load = useCallback(() => {
    getLeasesForLandlord().then(async res => {
      setLeases(res.data);
      const lists = await Promise.all(
        res.data.map(l => getDocumentsForLease(l.id).then(r => r.data).catch(() => []))
      );
      setDocuments(Object.fromEntries(res.data.map((l, i) => [l.id, lists[i]])));
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleTerminate(id) {
    if (!confirm('Terminate this lease?')) return;
    await terminateLease(id);
    load();
  }

  async function handleUpload(leaseId) {
    const file = files[leaseId];
    if (!file) return;
    await uploadDocument(leaseId, file);
    setFiles({ ...files, [leaseId]: null });
    load();
  }

  return (
    <>
      <PageHeader
        icon="bi-file-earmark-text"
        title="Leases"
        subtitle={`${leases.filter(l => l.status === 'active').length} active · ${leases.length} total`}
      />

      {leases.length === 0 ? (
        <div className="card"><div className="card-body empty-state">
          <i className="bi bi-file-earmark" />
          No leases yet — approve an application to create one.
        </div></div>
      ) : (
        leases.map(lease => (
          <div className="card card-hover mb-3" key={lease.id}>
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2 py-3">
              <h2 className="h6 fw-bold mb-0">
                <i className="bi bi-door-open text-primary me-1" />Unit #{lease.unit.unitNumber}
                <span className="text-muted fw-normal"> — {lease.unit.property.name}</span>
              </h2>
              <StatusBadge value={lease.status} />
            </div>

            <div className="card-body p-3 p-md-4">
              <div className="d-flex flex-wrap gap-4 mb-3 small text-muted">
                <span><i className="bi bi-calendar3 me-1" />{lease.startDate} → {lease.endDate}</span>
                <span><i className="bi bi-cash me-1" /><strong>UGX {Number(lease.monthlyRent).toLocaleString()}</strong>/mo</span>
                {lease.tenant && <span><i className="bi bi-person me-1" />{lease.tenant.name}</span>}
              </div>

              <h3 className="small fw-semibold text-muted text-uppercase mb-2">Documents</h3>
              {(documents[lease.id] || []).length === 0 ? (
                <p className="text-muted small mb-3">No documents uploaded.</p>
              ) : (
                <ul className="list-group list-group-flush mb-3" style={{ maxWidth: '480px' }}>
                  {(documents[lease.id] || []).map(doc => (
                    <li className="list-group-item px-0 py-2 border-0 border-bottom small" key={doc.id}>
                      <i className="bi bi-file-earmark-pdf text-danger me-2" />{doc.originalName}
                    </li>
                  ))}
                </ul>
              )}

              <div className="input-group" style={{ maxWidth: '480px' }}>
                <input
                  type="file"
                  className="form-control form-control-sm"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => setFiles({ ...files, [lease.id]: e.target.files[0] })}
                />
                <button className="btn btn-sm btn-outline-primary" onClick={() => handleUpload(lease.id)}>
                  <i className="bi bi-upload me-1" />Upload
                </button>
              </div>
            </div>

            {lease.status === 'active' && (
              <div className="card-footer bg-transparent border-top py-3">
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleTerminate(lease.id)}>
                  <i className="bi bi-x-circle me-1" />Terminate Lease
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </>
  );
}
