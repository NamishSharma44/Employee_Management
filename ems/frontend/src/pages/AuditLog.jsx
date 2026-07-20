import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import Spinner from '../components/Spinner';

const ACTION_TONE = { CREATE: 'success', UPDATE: 'default', DELETE: 'danger', LOGIN: 'default', APPROVE: 'success', REJECT: 'danger' };

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/audit', { params: { page, size: 15 } });
      setEntries(data.content);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Audit Log</h1>
          <p>A complete trail of every change made in the system</p>
        </div>
      </header>

      <section className="table-card">
        {loading ? <Spinner label="Loading audit log…" /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Timestamp</th><th>Entity</th><th>Action</th><th>Performed By</th><th>Details</th></tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td>{new Date(e.timestamp).toLocaleString()}</td>
                      <td>{e.entityType} #{e.entityId}</td>
                      <td><span className={`badge badge-${ACTION_TONE[e.action] || 'default'}`}>{e.action}</span></td>
                      <td>{e.performedBy}</td>
                      <td>{e.details}</td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr><td colSpan={5}><div className="empty-state"><h3>No audit entries yet</h3></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="btn btn-secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)} type="button">Previous</button>
                <span>Page {page + 1} of {totalPages}</span>
                <button className="btn btn-secondary" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} type="button">Next</button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
