import { useEffect, useState } from 'react';
import { getPropertyProfitability, getPortfolioSummary } from '../api/reports';
import PageHeader from '../components/PageHeader';

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    getPortfolioSummary().then(res => setSummary(res.data));
    getPropertyProfitability().then(res => setProperties(res.data));
  }, []);

  if (!summary) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status" aria-label="Loading reports">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  const money = n => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <PageHeader
        icon="bi-graph-up-arrow"
        title="Reports"
        subtitle="Profitability insights across your portfolio"
      />

      <h2 className="h6 text-muted text-uppercase fw-semibold mb-3">Portfolio Summary</h2>
      <div className="row row-cols-2 row-cols-lg-3 g-3 mb-4">
        <div className="col"><div className="card card-hover h-100"><div className="card-body py-3">
          <div className="stat-label"><i className="bi bi-buildings me-1" />Properties</div>
          <div className="stat-value">{summary.totalProperties}</div>
          <small className="text-muted">{summary.totalUnits} units total</small>
        </div></div></div>
        <div className="col"><div className="card card-hover h-100"><div className="card-body py-3">
          <div className="stat-label"><i className="bi bi-percent me-1" />Occupancy</div>
          <div className="stat-value">{summary.occupancyRate}</div>
          <small className="text-muted">{summary.occupiedUnits} occupied / {summary.vacantUnits} vacant</small>
        </div></div></div>
        <div className="col"><div className="card card-hover h-100"><div className="card-body py-3">
          <div className="stat-label"><i className="bi bi-cash-coin me-1" />Rent Collected</div>
          <div className="stat-value text-success">{money(summary.totalRentCollected)}</div>
        </div></div></div>
        <div className="col"><div className="card card-hover h-100"><div className="card-body py-3">
          <div className="stat-label"><i className="bi bi-wallet2 me-1" />Expenses</div>
          <div className="stat-value text-danger">{money(summary.totalExpenses)}</div>
        </div></div></div>
        <div className="col"><div className="card h-100 border-start border-success border-4"><div className="card-body py-3">
          <div className="stat-label"><i className="bi bi-graph-up-arrow me-1" />Net Profit</div>
          <div className={`stat-value ${summary.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>{money(summary.netProfit)}</div>
        </div></div></div>
      </div>

      <h2 className="h6 text-muted text-uppercase fw-semibold mb-3">By Property</h2>
      {properties.length === 0 ? (
        <div className="card"><div className="card-body empty-state">
          <i className="bi bi-bar-chart" />
          No property data available yet.
        </div></div>
      ) : (
        <div className="card">
          <div className="table-responsive table-wrap">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Occupancy</th>
                  <th className="text-end">Rent collected</th>
                  <th className="text-end">Expenses</th>
                  <th className="text-end">Net profit</th>
                </tr>
              </thead>
              <tbody>
                {properties.map(p => (
                  <tr key={p.propertyId}>
                    <td className="fw-semibold">{p.propertyName}
                      <small className="text-muted d-block">{p.occupiedUnits}/{p.totalUnits} units</small>
                    </td>
                    <td>{p.occupancyRate}</td>
                    <td className="text-end text-success">{money(p.totalRentCollected)}</td>
                    <td className="text-end text-danger">{money(p.totalExpenses)}</td>
                    <td className={`text-end fw-bold ${p.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                      {money(p.netProfit)}
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
