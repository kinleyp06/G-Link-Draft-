import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { MENUS } from './menus.js';
import { personName } from '../utils/format.js';

// Signed-in pages: top bar + role menu (side bar on wide screens, drop-down on phones).
export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menu = MENUS[user.role] || [];

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="topbar__brand">
          G-Link <span className="topbar__tag">RUB Guest House Booking</span>
        </NavLink>
        <button
          type="button"
          className="topbar__menu-btn ui-btn ui-btn--secondary ui-btn--small"
          aria-expanded={open}
          aria-controls="side-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Close menu' : 'Menu'}
        </button>
        <div className="topbar__user">
          <span className="topbar__who">
            {personName(user.first_name, user.last_name, user.email)} · {user.role}
          </span>
          <button
            type="button"
            className="ui-btn ui-btn--secondary ui-btn--small"
            onClick={() => {
              logout();
              navigate('/sign-in');
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <div className="app__body">
        <nav id="side-menu" className={`sidenav ${open ? 'sidenav--open' : ''}`} aria-label="Main menu">
          <ul>
            {menu.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={({ isActive }) => `sidenav__link ${isActive ? 'is-active' : ''}`}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <main className="app__main" id="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
