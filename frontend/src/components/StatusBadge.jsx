export default function StatusBadge({ value }) {
  if (!value) return null;
  return <span className={`badge badge-${String(value).toLowerCase()}`}>{value.replace('_', ' ')}</span>;
}
