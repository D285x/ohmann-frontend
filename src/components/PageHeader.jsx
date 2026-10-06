export default function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p className="lead">{subtitle}</p>}
      </div>
      {children && <div className="actions" style={{ marginTop: 0 }}>{children}</div>}
    </header>
  );
}
