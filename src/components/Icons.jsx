/* Small inline SVG icon set (stroke icons, 24px grid). */
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const Logo = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <defs>
      <linearGradient id="lg-logo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#0a84ff" />
        <stop offset="1" stopColor="#7d5cff" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="5" fill="url(#lg-logo)" />
    <ellipse cx="12" cy="12" rx="10.5" ry="4.2" fill="none" stroke="url(#lg-logo)" strokeWidth="1.6" transform="rotate(-28 12 12)" />
    <circle cx="20.6" cy="7.6" r="1.6" fill="#7d5cff" />
  </svg>
);

export const Sun = () => (
  <svg {...base}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const Moon = () => (
  <svg {...base}><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" /></svg>
);
export const Menu = () => (
  <svg {...base}><path d="M4 8h16M4 16h16" /></svg>
);
export const Close = () => (
  <svg {...base}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const Rocket = () => (
  <svg {...base}><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2" /><path d="M9 12a13 13 0 0 1 11-9 13 13 0 0 1-9 11l-2 2-2-2z" /><circle cx="15" cy="9" r="1.5" /></svg>
);
export const Orbit = () => (
  <svg {...base}><circle cx="12" cy="12" r="3" /><ellipse cx="12" cy="12" rx="10" ry="4.5" /><circle cx="21" cy="10" r="1" /></svg>
);
export const Database = () => (
  <svg {...base}><ellipse cx="12" cy="5.5" rx="8" ry="3" /><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>
);
export const Play = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
);
export const Pause = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor" /><rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor" /></svg>
);
