import { Outlet } from 'react-router-dom';

// Signed-out pages: brand bar and a centred card.
export default function AuthLayout() {
  return (
    <div className="auth">
      <header className="topbar">
        <span className="topbar__brand">
          G-Link <span className="topbar__tag">RUB Guest House Booking</span>
        </span>
      </header>
      <main className="auth__main">
        <div className="auth__card ui-card">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
