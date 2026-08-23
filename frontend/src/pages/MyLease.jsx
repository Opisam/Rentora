import { useCallback, useEffect, useState } from 'react';
import { getMyLeases } from '../api/leases';
import { uploadDocument, getDocumentsForLease } from '../api/documents';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

export default function MyLease() {
  const [leases, setLeases] = useState([]);
  const [documents, setDocuments] = useState({});
  const [files, setFiles] = useState({});

  const load = useCallback(() => {
    getMyLeases().then(async res => {
      setLeases(res.data);
      const lists = await Promise.all(
        res.data.map(l => getDocumentsForLease(l.id).then(r => r.data).catch(() => []))
      );
      setDocuments(Object.fromEntries(res.data.map((l, i) => [l.id, lists[i]])));
    });
  }, []);

  useEffect(() => { load(); }, [load]);

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
        title="My Leases"
        subtitle="Your rental agreements and documents"
      />

      {leases.length === 0 ? (
        <div className="card"><div className="card-body empty-state">
          <i className="bi bi-file-earmark" />
          You have no leases yet — apply for a unit to get started.
        </div></div>
      ) : (
        leases.map(lease => (
          <div className="card card-hover mb-3" key={lease.id}>
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2 py-3">
              <h2 className="h6 fw-bold mb-0">
                {lease.unit.property.name}
                <span className="text-muted fw-normal"> — Unit #{lease.unit.unitNumber}</span>
              </h2>
              <StatusBadge value={lease.status} />
            </div>

            <div className="card-body p-3 p-md-4">
              <div className="d-flex flex-wrap gap-4 mb-3 small text-muted">
                <span><i className="bi bi-calendar3 me-1" />{lease.startDate} → {lease.endDate}</span>
                <span><i className="bi bi-cash me-1" /><strong>${Number(lease.monthlyRent).toLocaleString()}</strong>/mo</span>
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
          </div>
        ))
      )}
    </>
  );
}
