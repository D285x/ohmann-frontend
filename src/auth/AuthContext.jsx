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

  // The hosted demo uses an in-memory database that is reset whenever the server
  // restarts, so a remembered login can point at an account that no longer exists.
  // Check it once against the server and quietly log out if it is gone.
  useEffect(() => {
    if (!user) return;
    UserApi.list()
      .then((all) => {
        if (!all.some((u) => u.id === user.id && u.email === user.email)) logout();
      })
      .catch(() => { /* server unreachable: keep the login, nothing to verify against */ });
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
