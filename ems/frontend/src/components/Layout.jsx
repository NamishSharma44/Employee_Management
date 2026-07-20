import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none"><path d="M3 10.5 12 3l9 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  employees: (
    <svg viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  ),
  departments: (
    <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.8"/></svg>
  ),
  orgchart: (
    <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="5" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="19" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7.5V12M12 12 5 16.7M12 12l7 4.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  ),
  leaves: (
    <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
  ),
  audit: (
    <svg viewBox="0 0 24 24" fill="none"><path d="M9 12h6M9 16h6M9 8h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
};

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = (user?.fullName || user?.username || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">NX</div>
          <div className="brand-text">
            <span className="brand-title">Nexus HR</span>
            <span className="brand-subtitle">Workforce Suite</span>
          </div>
        </div>

        <nav className="side-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {NAV_ICONS.dashboard}<span>Dashboard</span>
          </NavLink>
          <NavLink to="/employees" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {NAV_ICONS.employees}<span>Employees</span>
          </NavLink>
          <NavLink to="/departments" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {NAV_ICONS.departments}<span>Departments</span>
          </NavLink>
          <NavLink to="/org-chart" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {NAV_ICONS.orgchart}<span>Org Chart</span>
          </NavLink>
          <NavLink to="/leaves" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {NAV_ICONS.leaves}<span>Leave Management</span>
          </NavLink>
          {hasRole('ADMIN') && (
            <NavLink to="/audit-log" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              {NAV_ICONS.audit}<span>Audit Log</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar-sm">{initials}</div>
            <div className="user-card-text">
              <span className="user-card-name">{user?.fullName || user?.username}</span>
              <span className="user-card-role">{user?.role}</span>
            </div>
          </div>
          <button className="nav-item logout-btn" onClick={handleLogout} type="button">
            {NAV_ICONS.logout}<span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
