import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';

const STATUS_TONE = { ACTIVE: 'success', ON_LEAVE: 'warning', TERMINATED: 'danger' };

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/employees/${id}`),
      api.get(`/employees/${id}/reports`),
    ]).then(([empRes, reportsRes]) => {
      setEmployee(empRes.data);
      setReports(reportsRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner label="Loading profile…" />;
  if (!employee) return <p>Employee not found.</p>;

  function initials(first, last) {
    return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
  }

  return (
    <>
      <header className="topbar">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} type="button">← Back</button>
        </div>
      </header>

      <section className="profile-card">
        {employee.photoUrl ? (
          <img src={employee.photoUrl} alt="" className="profile-avatar" />
        ) : (
          <div className="profile-avatar profile-avatar-fallback">{initials(employee.firstName, employee.lastName)}</div>
        )}
        <div className="profile-info">
          <h2>{employee.firstName} {employee.lastName}</h2>
          <p className="profile-position">{employee.position} · {employee.departmentName}</p>
          <div className="profile-meta">
            <Badge tone={STATUS_TONE[employee.status]}>{employee.status.replace('_', ' ')}</Badge>
            <span className="profile-code">{employee.employeeCode}</span>
          </div>
        </div>
      </section>

      <section className="detail-grid">
        <div className="detail-card">
          <h3>Contact Information</h3>
          <dl className="detail-list">
            <dt>Email</dt><dd>{employee.email}</dd>
            <dt>Phone</dt><dd>{employee.phone || '—'}</dd>
            <dt>Address</dt><dd>{employee.address || '—'}</dd>
            <dt>Date of Birth</dt><dd>{employee.dateOfBirth || '—'}</dd>
            <dt>Gender</dt><dd>{employee.gender || '—'}</dd>
          </dl>
        </div>

        <div className="detail-card">
          <h3>Employment Details</h3>
          <dl className="detail-list">
            <dt>Department</dt><dd>{employee.departmentName}</dd>
            <dt>Position</dt><dd>{employee.position}</dd>
            <dt>Salary</dt><dd>${Number(employee.salary).toLocaleString()}</dd>
            <dt>Date Joined</dt><dd>{employee.dateOfJoining}</dd>
            <dt>Reports To</dt>
            <dd>
              {employee.managerId ? (
                <Link to={`/employees/${employee.managerId}`} className="link">{employee.managerName}</Link>
              ) : '— (Top of hierarchy)'}
            </dd>
          </dl>
        </div>

        <div className="detail-card detail-card-wide">
          <h3>Direct Reports ({reports.length})</h3>
          {reports.length === 0 ? (
            <p className="muted-text">This employee has no direct reports.</p>
          ) : (
            <div className="reports-grid">
              {reports.map((r) => (
                <Link to={`/employees/${r.id}`} key={r.id} className="report-chip">
                  {r.photoUrl ? <img src={r.photoUrl} alt="" /> : <span className="report-chip-fallback">{initials(r.firstName, r.lastName)}</span>}
                  <div>
                    <strong>{r.firstName} {r.lastName}</strong>
                    <span>{r.position}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
