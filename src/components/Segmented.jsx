/** iOS-style segmented control. options: [[value, label], ...] */
export default function Segmented({ options, value, onChange, block = false, label }) {
  return (
    <div className={`segmented ${block ? 'block' : ''}`} role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v}
          className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}
