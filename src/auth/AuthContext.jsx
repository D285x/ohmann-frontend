import { createContext, useContext, useState } from 'react';

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
