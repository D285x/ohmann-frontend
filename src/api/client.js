import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 120000,
});

/** Turns an Axios error into { message, fieldErrors } for display. */
export function parseError(err) {
  if (err.response?.data) {
    const d = err.response.data;
    return { message: d.message || `Request failed (${err.response.status})`, fieldErrors: d.fieldErrors || {} };
  }
  if (err.request) return { message: 'Cannot reach the server. The backend may be waking up (Render free tier sleeps when idle); try again in a minute.', fieldErrors: {} };
  return { message: err.message, fieldErrors: {} };
}

export const VehicleApi = {
  list: () => api.get('/vehicles').then((r) => r.data),
  create: (v) => api.post('/vehicles', v).then((r) => r.data),
  update: (id, v) => api.put(`/vehicles/${id}`, v).then((r) => r.data),
  remove: (id) => api.delete(`/vehicles/${id}`),
  // Aero-service (shockFLOW GPU CFD, or its analytic fallback): fetches a
  // Mach-indexed drag curve for the vehicle and stores it, or discards one.
  // refineAero can take a while (a real CFD sweep), hence the longer timeout.
  refineAero: (id, opts) => api.post(`/vehicles/${id}/aero/refine`, opts || {}, { timeout: 200000 }).then((r) => r.data),
  resetAero: (id) => api.delete(`/vehicles/${id}/aero`).then((r) => r.data),
};

export const SiteApi = {
  list: () => api.get('/sites').then((r) => r.data),
  create: (s) => api.post('/sites', s).then((r) => r.data),
  update: (id, s) => api.put(`/sites/${id}`, s).then((r) => r.data),
  remove: (id) => api.delete(`/sites/${id}`),
};

export const MissionApi = {
  plan: (req) => api.post('/missions/plan', req).then((r) => r.data),
  list: () => api.get('/missions').then((r) => r.data),
  get: (id) => api.get(`/missions/${id}`).then((r) => r.data),
  remove: (id) => api.delete(`/missions/${id}`),
  exportCsv: (id) => api.get(`/missions/${id}/export`, { responseType: 'blob' }),
};

export const BodyApi = {
  list: () => api.get('/bodies').then((r) => r.data),
  create: (b) => api.post('/bodies', b).then((r) => r.data),
  update: (id, b) => api.put(`/bodies/${id}`, b).then((r) => r.data),
  remove: (id) => api.delete(`/bodies/${id}`),
};

export const TransferApi = {
  plan: (req) => api.post('/transfers/plan', req).then((r) => r.data),
  list: () => api.get('/transfers').then((r) => r.data),
  remove: (id) => api.delete(`/transfers/${id}`),
};

export const StatsApi = {
  get: () => api.get('/stats').then((r) => r.data),
};

export default api;

export const UserApi = {
  register: (u) => api.post('/users/register', u).then((r) => r.data),
  login: (credentials) => api.post('/users/login', credentials).then((r) => r.data),
  list: () => api.get('/users').then((r) => r.data),
  remove: (id) => api.delete(`/users/${id}`),
};
