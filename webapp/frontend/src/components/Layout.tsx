import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isPromoter = user?.role === 'promoter';

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">DroneShield · Test Manager</div>
        <nav className="nav">
          <NavLink to="/tests">Drafts</NavLink>
          <NavLink to="/production">Production</NavLink>
          <NavLink to="/runs">Runs</NavLink>
          {isPromoter && <NavLink to="/users">Users</NavLink>}
        </nav>
        <div className="user">
          <span className={`role role-${user?.role}`}>{user?.role}</span>
          <span>{user?.username}</span>
          <button
            className="btn ghost"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
