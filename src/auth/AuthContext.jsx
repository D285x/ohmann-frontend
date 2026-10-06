import { createContext, useContext, useEffect, useState } from 'react';
import { UserApi } from '../api/client.js';

const AuthContext = createContext(null);
const KEY = 'ohmann.operator';

function loadStored() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

/** Keeps the logged-in operator for the whole app (and across page reloads). */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStored);

  // A remembered login is only useful while its session token is still valid on the
  // server (sessions, and the demo database, are reset whenever the server restarts).
  // Check it once on load; logins saved before tokens existed have none and are dropped.
  useEffect(() => {
    if (!user) return;
    if (!user.token) { logout(); return; }
    UserApi.me().catch((err) => {
      if (err.response?.status === 401 || err.response?.status === 404) logout();
      /* server unreachable: keep the login, nothing to verify against */
    });
  }, []);

  // Any request that comes back 401 means the session is gone
  useEffect(() => {
    const onExpired = () => logout();
    window.addEventListener('ohmann:session-expired', onExpired);
    return () => window.removeEventListener('ohmann:session-expired', onExpired);
  }, []);

  const login = (u) => {
    setUser(u);
    try { localStorage.setItem(KEY, JSON.stringify(u)); } catch { /* storage unavailable */ }
  };

  const logout = () => {
    setUser(null);
    try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
