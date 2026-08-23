export default function PageHeader({ icon = 'bi-grid-1x2', title, subtitle, children }) {
  return (
    <div className="d-flex align-items-start gap-3 flex-wrap mb-4">
      <span className="page-icon"><i className={`bi ${icon}`} /></span>
      <div className="me-auto">
        <h1 className="page-title h3">{title}</h1>
        {subtitle && <p className="page-subtitle mb-0">{subtitle}</p>}
      </div>
      {children && <div className="d-flex gap-2 flex-wrap">{children}</div>}
    </div>
  );
}
