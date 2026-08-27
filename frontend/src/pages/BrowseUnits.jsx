import { useEffect, useState, useMemo } from 'react';
import { getVacantUnits } from '../api/properties';
import { applyToUnit } from '../api/applications';
import PageHeader from '../components/PageHeader';

const BEDROOM_FILTERS = [
  { value: null, label: 'All beds' },
  { value: 1, label: '1 bed' },
  { value: 2, label: '2 beds' },
  { value: 3, label: '3 beds' },
  { value: 4, label: '4+ beds' },
];

export default function BrowseUnits() {
  const [units, setUnits] = useState([]);
  const [messages, setMessages] = useState({});
  const [status, setStatus] = useState(null);
  const [filterBeds, setFilterBeds] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getVacantUnits().then(res => setUnits(res.data));
  }, []);

  const filtered = useMemo(() => {
    let result = units;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.property?.name?.toLowerCase().includes(q) ||
        u.property?.city?.toLowerCase().includes(q) ||
        u.property?.address?.toLowerCase().includes(q) ||
        String(u.unitNumber).toLowerCase().includes(q)
      );
    }
    if (filterBeds !== null) {
      result = result.filter(u => filterBeds === 4 ? Number(u.bedrooms) >= 4 : Number(u.bedrooms) === filterBeds);
    }
    return result;
  }, [units, filterBeds, search]);

  async function handleApply(unitId) {
    try {
      await applyToUnit(unitId, messages[unitId] || '');
      setStatus({ type: 'success', text: 'Application submitted! The landlord has been notified.' });
      setMessages(prev => ({ ...prev, [unitId]: '' }));
    } catch (err) {
      setStatus({ type: 'danger', text: err.response?.data?.error || 'Failed to apply' });
    }
  }

  return (
    <>
      <PageHeader
        icon="bi-search"
        title="Available Units"
        subtitle={`${filtered.length} vacant unit${filtered.length === 1 ? '' : 's'} ready to rent`}
      />

      {status && (
        <div className={`alert alert-${status.type} d-flex align-items-center gap-2 py-2`} role="alert">
          <i className={`bi ${status.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} />
          <div>{status.text}</div>
        </div>
      )}

      <div className="d-flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          className="form-control form-control-sm"
          style={{ maxWidth: 260 }}
          placeholder="Search by property, city, or unit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {BEDROOM_FILTERS.map(f => (
          <button
            key={String(f.value)}
            className={`btn btn-sm ${filterBeds === f.value ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilterBeds(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && !status ? (
        <div className="card"><div className="card-body empty-state">
          <i className="bi bi-house-x" />
          No vacant units match your filters — try adjusting your search.
        </div></div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
          {filtered.map(unit => (
            <div className="col" key={unit.id}>
              <div className="card card-hover h-100">
                <div className="card-header d-flex align-items-center justify-content-between py-3">
                  <span className="fw-bold">{unit.property.name}</span>
                  <span className="badge badge-vacant">vacant</span>
                </div>
                <div className="card-body">
                  <p className="text-muted small mb-3">
                    <i className="bi bi-geo-alt me-1" />{unit.property.address}, {unit.property.city}
                  </p>

                  <div className="d-flex flex-wrap gap-3 mb-3 text-muted small">
                    <span><i className="bi bi-door-open me-1" />Unit #{unit.unitNumber}</span>
                    <span><i className="bi bi-bed me-1" />{Number(unit.bedrooms)} bd</span>
                    <span><i className="bi bi-droplet me-1" />{Number(unit.bathrooms)} ba</span>
                  </div>

                  <p className="mb-0">
                    <span className="h4 fw-bold text-dark">UGX {Number(unit.rentAmount).toLocaleString()}</span>
                    <span className="text-muted">/month</span>
                  </p>
                </div>
                <div className="card-footer bg-transparent border-top py-3">
                  <input
                    className="form-control form-control-sm mb-2"
                    placeholder={`Message to ${unit.property.name}'s landlord (optional)`}
                    value={messages[unit.id] || ''}
                    onChange={e => setMessages({ ...messages, [unit.id]: e.target.value })}
                  />
                  <button className="btn btn-primary btn-sm w-100" onClick={() => handleApply(unit.id)}>
                    <i className="bi bi-send me-1" />Apply for this unit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
