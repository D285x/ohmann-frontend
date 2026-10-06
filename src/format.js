export const num = (v, digits = 0) =>
  v === null || v === undefined || Number.isNaN(v)
    ? '-'
    : Number(v).toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const dateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC' : '-';

export const date = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'UTC' }) : '-';

export const title = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : '');

/** Converts a datetime-local input value (treated as UTC) to an ISO string. */
export const localInputToIso = (v) => (v ? new Date(v + ':00Z').toISOString() : null);

/** Compact UTC timestamp, e.g. 2026-09-16 00:41 UTC. */
export const utcShort = (iso) => (iso ? `${new Date(iso).toISOString().slice(0, 16).replace('T', ' ')} UTC` : '-');
