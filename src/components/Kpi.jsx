export default function Kpi({ label, value, unit, tone, wide = false }) {
  const cls = ['kpi', tone ? `kpi-${tone}` : '', wide ? 'kpi-wide' : ''].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {value}
        {unit && <span className="kpi-unit"> {unit}</span>}
      </div>
    </div>
  );
}
