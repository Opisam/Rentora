import { useCallback, useEffect, useState } from 'react';
import { getRentForLandlord, markRentPaid, triggerRentGeneration } from '../api/rent';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

export default function RentDashboard() {
  const [payments, setPayments] = useState([]);

  const load = useCallback(() => {
    getRentForLandlord().then(res => setPayments(res.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleMarkPaid(id) {
    await markRentPaid(id);
    load();
  }

  async function handleGenerate() {
    await triggerRentGeneration();
    load();
  }

  const unpaid = payments.filter(p => p.status !== 'paid');
  const collected = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amountDue), 0);
  const outstanding = unpaid.reduce((sum, p) => sum + Number(p.amountDue), 0);

  return (
    <>
      <PageHeader
        icon="bi-cash-stack"
        title="Rent Dashboard"
        subtitle="Track rent across your portfolio"
      >
        <button className="btn btn-primary" onClick={handleGenerate}>
          <i className="bi bi-arrow-repeat me-1" />Generate This Month&apos;s Rent
        </button>
      </PageHeader>

      <div className="row row-cols-2 row-cols-lg-4 g-3 mb-4">
        <div className="col"><div className="card card-hover h-100"><div className="card-body py-3">
          <div className="stat-label">Total records</div>
          <div className="stat-value">{payments.length}</div>
        </div></div></div>
        <div className="col"><div className="card card-hover h-100"><div className="card-body py-3">
          <div className="stat-label">Collected</div>
          <div className="stat-value text-success">UGX {collected.toLocaleString()}</div>
        </div></div></div>
        <div className="col"><div className="card card-hover h-100"><div className="card-body py-3">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value text-danger">UGX {outstanding.toLocaleString()}</div>
        </div></div></div>
        <div className="col"><div className="card card-hover h-100"><div className="card-body py-3">
          <div className="stat-label">Unpaid count</div>
          <div className="stat-value">{unpaid.length}</div>
        </div></div></div>
      </div>

      {payments.length === 0 ? (
        <div className="card"><div className="card-body empty-state">
          <i className="bi bi-cash-stack" />
          No rent records — generate this month&apos;s rent to begin tracking.
        </div></div>
      ) : (
        <div className="card">
          <div className="table-responsive table-wrap">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Unit</th>
                  <th>Tenant</th>
                  <th>Due date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="fw-semibold">{p.lease.unit.property.name}</td>
                    <td>#{p.lease.unit.unitNumber}</td>
                    <td>{p.lease.tenant?.name || '—'}</td>
                    <td>{p.dueDate}</td>
                    <td>UGX {Number(p.amountDue).toLocaleString()}</td>
                    <td><StatusBadge value={p.status} /></td>
                    <td className="text-end">
                      {p.status !== 'paid' && (
                        <button className="btn btn-sm btn-outline-success" onClick={() => handleMarkPaid(p.id)}>
                          <i className="bi bi-check2-circle me-1" />Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
