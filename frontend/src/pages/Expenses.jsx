import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createExpense, getExpensesForProperty, deleteExpense } from '../api/expenses';
import PageHeader from '../components/PageHeader';

const CATEGORIES = ['repairs', 'insurance', 'taxes', 'utilities', 'management_fees', 'other'];

export default function Expenses() {
  const { propertyId } = useParams();
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ category: 'repairs', amount: '', description: '', date: '' });

  const load = useCallback(() => {
    getExpensesForProperty(propertyId).then(res => setExpenses(res.data));
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    await createExpense(propertyId, form);
    setForm({ category: 'repairs', amount: '', description: '', date: '' });
    load();
  }

  async function handleDelete(id) {
    await deleteExpense(id);
    load();
  }

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <>
      <PageHeader
        icon="bi-receipt"
        title="Expenses"
        subtitle="Track costs against this property"
      >
        <Link to="/properties" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-1" />Back to Properties
        </Link>
      </PageHeader>

      <div className="card mb-4">
        <div className="card-header d-flex align-items-center gap-2 py-3">
          <i className="bi bi-plus-circle text-primary" />
          Add an expense
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3 align-items-end">
            <div className="col-md-3 col-6">
              <label htmlFor="expCat" className="form-label small fw-semibold">Category</label>
              <select id="expCat" className="form-select" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="col-md-2 col-6">
              <label htmlFor="expAmount" className="form-label small fw-semibold">Amount ($)</label>
              <input id="expAmount" type="number" min="0" step="0.01" className="form-control" placeholder="0.00" required
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="col-md-3">
              <label htmlFor="expDesc" className="form-label small fw-semibold">Description</label>
              <input id="expDesc" className="form-control" placeholder="Optional details"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="col-md-2 col-6">
              <label htmlFor="expDate" className="form-label small fw-semibold">Date</label>
              <input id="expDate" type="date" className="form-control" required
                value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="col-md-2 col-6">
              <button type="submit" className="btn btn-primary w-100">
                <i className="bi bi-plus-lg me-1" />Add
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body d-flex align-items-center justify-content-between py-3 border-bottom flex-wrap gap-2">
          <span className="fw-semibold">Total expenses</span>
          <span className="h5 text-danger fw-bold mb-0">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        {expenses.length === 0 ? (
          <div className="card-body empty-state pb-4">
            <i className="bi bi-receipt-cutoff" />
            No expenses recorded yet.
          </div>
        ) : (
          <div className="table-responsive table-wrap">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th className="text-end">Amount</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id}>
                    <td>{exp.date}</td>
                    <td><span className="badge bg-light text-dark border">{String(exp.category).replace('_', ' ')}</span></td>
                    <td className="text-muted">{exp.description || '—'}</td>
                    <td className="text-end fw-semibold">${Number(exp.amount).toLocaleString()}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(exp.id)} aria-label={`Delete expense from ${exp.date}`}>
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
