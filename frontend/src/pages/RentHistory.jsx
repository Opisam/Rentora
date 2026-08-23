import { useEffect, useState } from 'react';
import { getMyRentHistory } from '../api/rent';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

export default function RentHistory() {
  const [payments, setPayments] = useState([]);

  useEffect(() => { getMyRentHistory().then(res => setPayments(res.data)); }, []);

  return (
    <>
      <PageHeader
        icon="bi-cash-coin"
        title="Rent History"
        subtitle="Your upcoming dues and payment record"
      />

      {payments.length === 0 ? (
        <div className="card"><div className="card-body empty-state">
          <i className="bi bi-cash-stack" />
          No rent records yet.
        </div></div>
      ) : (
        <div className="card">
          <div className="table-responsive table-wrap">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Unit</th>
                  <th>Due date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Paid on</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="fw-semibold">{p.lease.unit.property.name}</td>
                    <td>#{p.lease.unit.unitNumber}</td>
                    <td>{p.dueDate}</td>
                    <td>${Number(p.amountDue).toLocaleString()}</td>
                    <td><StatusBadge value={p.status} /></td>
                    <td className="text-muted">{p.paidDate || '—'}</td>
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
