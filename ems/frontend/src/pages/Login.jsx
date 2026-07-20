import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DEMO_ACCOUNTS = [
  { role: 'Admin', username: 'admin', password: 'admin123' },
  { role: 'Manager', username: 'manager', password: 'manager123' },
  { role: 'Employee', username: 'employee', password: 'employee123' },
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      showToast(`Welcome back, ${user.fullName || user.username}`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(account) {
    setUsername(account.username);
    setPassword(account.password);
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-brand">
          <div className="brand-mark brand-mark-lg">NX</div>
          <h1>Nexus HR</h1>
          <p>Complete workforce management for modern teams</p>
        </div>

        <ul className="auth-feature-list">
          <li>Role-based access for Admins, Managers &amp; Employees</li>
          <li>Org hierarchy, leave workflows &amp; live analytics</li>
          <li>Full audit trail of every change</li>
        </ul>
      </div>

      <div className="auth-form-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Sign in</h2>
          <p className="auth-subtitle">Enter your credentials to access the dashboard</p>

          {error && <div className="auth-error">{error}</div>}

          <div className="form-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="demo-accounts">
            <span className="demo-accounts-label">Demo accounts</span>
            <div className="demo-accounts-grid">
              {DEMO_ACCOUNTS.map((acc) => (
                <button type="button" key={acc.username} className="demo-account-chip" onClick={() => fillDemo(acc)}>
                  <strong>{acc.role}</strong>
                  <span>{acc.username} / {acc.password}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
