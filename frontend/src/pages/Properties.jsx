import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyProperties, createProperty, createUnit } from '../api/properties';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

const EMPTY_UNIT = { unitNumber: '', bedrooms: 1, bathrooms: 1, rentAmount: '' };

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({ name: '', address: '', city: '' });
  const [unitForms, setUnitForms] = useState({});
  const [error, setError] = useState('');

  const loadProperties = useCallback(() => {
    getMyProperties().then(res => setProperties(res.data));
  }, []);

  useEffect(() => { loadProperties(); }, [loadProperties]);

  async function handleCreateProperty(e) {
    e.preventDefault();
    setError('');
    try {
      await createProperty(form);
      setForm({ name: '', address: '', city: '' });
      loadProperties();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create property');
    }
  }

  async function handleAddUnit(propertyId) {
    const unitForm = unitForms[propertyId] || EMPTY_UNIT;
    await createUnit(propertyId, unitForm);
    setUnitForms({ ...unitForms, [propertyId]: { ...EMPTY_UNIT } });
    loadProperties();
  }

  function updateUnitForm(propertyId, field, value) {
    setUnitForms({
      ...unitForms,
      [propertyId]: { ...(unitForms[propertyId] || {}), [field]: value },
    });
  }

  return (
    <>
      <PageHeader
        icon="bi-buildings"
        title="My Properties"
        subtitle={`${properties.length} propert${properties.length === 1 ? 'y' : 'ies'} in your portfolio`}
      />

      <div className="card mb-4">
        <div className="card-header d-flex align-items-center gap-2 py-3">
          <i className="bi bi-plus-circle text-primary" />
          Add a new property
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small" role="alert">
              <i className="bi bi-exclamation-circle-fill" />
              <div>{error}</div>
            </div>
          )}
          <form onSubmit={handleCreateProperty} className="row g-3 align-items-end">
            <div className="col-md-4">
              <label htmlFor="propName" className="form-label small fw-semibold">Name</label>
              <input id="propName" className="form-control" placeholder="e.g. Maple Court"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="col-md-4">
              <label htmlFor="propAddress" className="form-label small fw-semibold">Address</label>
              <input id="propAddress" className="form-control" placeholder="123 Main Street"
                value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
            </div>
            <div className="col-md-2">
              <label htmlFor="propCity" className="form-label small fw-semibold">City</label>
              <input id="propCity" className="form-control" placeholder="Springfield"
                value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100">
                <i className="bi bi-plus-lg me-1" />Add
              </button>
            </div>
          </form>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="card"><div className="card-body empty-state">
          <i className="bi bi-buildings" />
          No properties yet — add your first one above.
        </div></div>
      ) : (
        properties.map(property => (
          <div className="card card-hover mb-4" key={property.id}>
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2 py-3">
              <div>
                <h2 className="h6 fw-bold mb-0">{property.name}</h2>
                <small className="text-muted">
                  <i className="bi bi-geo-alt me-1" />{property.address}, {property.city}
                </small>
              </div>
              <Link to={`/properties/${property.id}/expenses`} className="btn btn-sm btn-outline-primary">
                <i className="bi bi-receipt me-1" />Expenses
              </Link>
            </div>

            <div className="card-body p-0">
              {property.units?.length === 0 && (
                <p className="text-muted small m-3 mb-0">No units added yet.</p>
              )}
              {property.units?.length > 0 && (
                <div className="table-responsive table-wrap">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Unit</th>
                        <th>Bedrooms</th>
                        <th>Bathrooms</th>
                        <th>Rent / mo</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {property.units.map(unit => (
                        <tr key={unit.id}>
                          <td className="fw-semibold">#{unit.unitNumber}</td>
                          <td>{unit.bedrooms}</td>
                          <td>{unit.bathrooms}</td>
                          <td>${Number(unit.rentAmount).toLocaleString()}</td>
                          <td><StatusBadge value={unit.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card-footer bg-transparent border-top py-3">
              <form className="row g-2 align-items-end"
                onSubmit={e => { e.preventDefault(); handleAddUnit(property.id); }}>
                <div className="col-6 col-md-2">
                  <input className="form-control form-control-sm" placeholder="Unit #"
                    value={unitForms[property.id]?.unitNumber || ''}
                    onChange={e => updateUnitForm(property.id, 'unitNumber', e.target.value)} />
                </div>
                <div className="col-6 col-md-2">
                  <input type="number" min="1" className="form-control form-control-sm" placeholder="Beds"
                    value={unitForms[property.id]?.bedrooms ?? ''}
                    onChange={e => updateUnitForm(property.id, 'bedrooms', e.target.value)} />
                </div>
                <div className="col-6 col-md-2">
                  <input type="number" min="1" step="0.5" className="form-control form-control-sm" placeholder="Baths"
                    value={unitForms[property.id]?.bathrooms ?? ''}
                    onChange={e => updateUnitForm(property.id, 'bathrooms', e.target.value)} />
                </div>
                <div className="col-6 col-md-3">
                  <input type="number" min="0" className="form-control form-control-sm" placeholder="Rent ($/mo)"
                    value={unitForms[property.id]?.rentAmount || ''}
                    onChange={e => updateUnitForm(property.id, 'rentAmount', e.target.value)} />
                </div>
                <div className="col-md-3">
                  <button type="submit" className="btn btn-sm btn-primary w-100">
                    <i className="bi bi-door-open me-1" />Add Unit
                  </button>
                </div>
              </form>
            </div>
          </div>
        ))
      )}
    </>
  );
}
