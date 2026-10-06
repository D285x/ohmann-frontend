/** Labelled form control with an inline error message (controlled component). */
export default function Field({ label, name, error, hint, children, ...inputProps }) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span className="field-label">{label}</span>
      {children || <input name={name} {...inputProps} />}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="error-text">{error}</span>}
    </label>
  );
}
