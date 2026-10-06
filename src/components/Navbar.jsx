import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import useTheme from '../hooks/useTheme.js';
import { Logo, Sun, Moon, Menu, Close } from './Icons.jsx';

const links = [
  ['/', 'Overview'],
  ['/launch', 'Launch'],
  ['/transfer', 'Transfer'],
  ['/vehicles', 'Vehicles'],
  ['/sites', 'Sites'],
  ['/bodies', 'Bodies'],
  ['/history', 'History'],
  ['/operators', 'Operators'],
];

const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header className="navbar">
      <Link to="/" className="brand"><Logo className="brand-mark" />OhMann</Link>

      <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Main">
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="session">
        <button type="button" className="icon-btn" onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          {theme === 'dark' ? <Sun /> : <Moon />}
        </button>
        {user ? (
          <>
            <span className="avatar" title={user.fullName}>{initials(user.fullName)}</span>
            <span className="session-name">{user.fullName.split(' ')[0]}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/login'); }}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
            <Link to="/register" className="btn btn-sm">Sign up</Link>
          </>
        )}
        <button type="button" className="icon-btn menu-toggle" onClick={() => setOpen((o) => !o)}
          aria-label="Menu" aria-expanded={open}>
          {open ? <Close /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
