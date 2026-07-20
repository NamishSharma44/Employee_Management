import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import api from '../api/client';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';
import { Link } from 'react-router-dom';

const COLORS = ['#4f46e5', '#7c3aed', '#2563eb', '#16a34a', '#d97706', '#dc2626', '#0891b2'];

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then((res) => setStats(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (!stats) return <p>Could not load dashboard data.</p>;

  const deptData = Object.entries(stats.headcountByDepartment || {}).map(([name, value]) => ({ name, value }));
  const salaryData = Object.entries(stats.salaryBands || {}).map(([name, value]) => ({ name, value }));
  const trendData = Object.entries(stats.hiringTrend || {}).map(([month, count]) => ({ month, count }));

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Dashboard</h1>
          <p>A live snapshot of your organization</p>
        </div>
        <Link to="/employees" className="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Manage Employees
        </Link>
      </header>

      <section className="stats-grid">
        <StatCard
          value={stats.totalEmployees}
          label="Total Employees"
          iconClass="icon-blue"
          icon={<svg viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>}
        />
        <StatCard
          value={stats.totalDepartments}
          label="Departments"
          iconClass="icon-purple"
          icon={<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.8"/></svg>}
        />
        <StatCard
          value={formatCurrency(stats.averageSalary)}
          label="Average Salary"
          iconClass="icon-green"
          icon={<svg viewBox="0 0 24 24" fill="none"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
        />
        <StatCard
          value={stats.pendingLeaveRequests}
          label="Pending Leave Requests"
          iconClass="icon-amber"
          icon={<svg viewBox="0 0 24 24" fill="none"><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/></svg>}
        />
      </section>

      <section className="status-strip">
        <div className="status-chip status-active"><span className="dot" /> {stats.activeCount} Active</div>
        <div className="status-chip status-leave"><span className="dot" /> {stats.onLeaveCount} On Leave</div>
        <div className="status-chip status-terminated"><span className="dot" /> {stats.terminatedCount} Terminated</div>
      </section>

      <section className="charts-grid">
        <div className="chart-card">
          <h3>Headcount by Department</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deptData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: '#f5f6fa' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {deptData.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Salary Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={salaryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={({ name }) => name}>
                {salaryData.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card chart-card-wide">
          <h3>Hiring Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" name="New hires" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="table-card">
        <div className="table-toolbar">
          <h3 style={{ margin: 0 }}>Recent Hires</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Position</th>
                <th>Date Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats.recentHires || []).map((e) => (
                <tr key={e.id}>
                  <td>{e.firstName} {e.lastName}</td>
                  <td>{e.departmentName}</td>
                  <td>{e.position}</td>
                  <td>{e.dateOfJoining}</td>
                  <td><Badge tone={e.status === 'ACTIVE' ? 'success' : e.status === 'ON_LEAVE' ? 'warning' : 'danger'}>{e.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
