/** Activity indicator in the style of the system spinner. */
export default function Spinner({ text }) {
  const bars = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <svg className="spinner" viewBox="0 0 32 32" aria-hidden="true">
        {bars.map((i) => (
          <rect key={i} x="14.75" y="2" width="2.5" height="8" rx="1.25" fill="currentColor"
            opacity={0.15 + (i / 12) * 0.85} transform={`rotate(${i * 30} 16 16)`} />
        ))}
      </svg>
      {text && <p>{text}</p>}
    </div>
  );
}
