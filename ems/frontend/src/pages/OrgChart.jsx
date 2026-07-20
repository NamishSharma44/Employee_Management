import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Spinner from '../components/Spinner';

function initials(first, last) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

function OrgNode({ employee, childrenMap }) {
  const kids = childrenMap[employee.id] || [];
  return (
    <div className="org-node">
      <Link to={`/employees/${employee.id}`} className="org-card">
        {employee.photoUrl ? <img src={employee.photoUrl} alt="" /> : <span className="org-card-fallback">{initials(employee.firstName, employee.lastName)}</span>}
        <div>
          <strong>{employee.firstName} {employee.lastName}</strong>
          <span>{employee.position}</span>
        </div>
      </Link>
      {kids.length > 0 && (
        <div className="org-children">
          {kids.map((child) => (
            <OrgNode key={child.id} employee={child} childrenMap={childrenMap} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/employees/all').then((res) => setEmployees(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Building org chart…" />;

  const childrenMap = {};
  employees.forEach((e) => {
    if (e.managerId) {
      childrenMap[e.managerId] = childrenMap[e.managerId] || [];
      childrenMap[e.managerId].push(e);
    }
  });
  const roots = employees.filter((e) => !e.managerId);

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Organization Chart</h1>
          <p>Reporting hierarchy across the company</p>
        </div>
      </header>

      <section className="table-card org-chart-card">
        {roots.length === 0 ? (
          <div className="empty-state"><h3>No hierarchy data</h3><p>Assign managers to employees to see the org chart.</p></div>
        ) : (
          <div className="org-chart-scroll">
            {roots.map((root) => (
              <OrgNode key={root.id} employee={root} childrenMap={childrenMap} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
