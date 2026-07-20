import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const STATUS_TONE = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger', CANCELLED: 'default' };
const EMPTY_FORM = { leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' };

export default function Leaves() {
  const { user, hasRole } = useAuth();
  const { showToast } = useToast();
  const canReview = hasRole('ADMIN', 'MANAGER');
  const hasOwnRecord = !!user?.employeeId;

  const [tab, setTab] = useState(hasOwnRecord ? 'mine' : 'team');
  const [myLeaves, setMyLeaves] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [applyOpen, setApplyOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const loadMine = useCallback(async () => {
    if (!hasOwnRecord) return;
    const { data } = await api.get(`/leaves/employee/${user.employeeId}`, { params: { size: 50 } });
    setMyLeaves(data.content);
  }, [hasOwnRecord, user]);

  const loadTeam = useCallback(async () => {
    if (!canReview) return;
    const { data } = await api.get('/leaves', { params: { status: statusFilter || undefined, size: 50 } });
    setTeamLeaves(data.content);
  }, [canReview, statusFilter]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadMine(), loadTeam()]);
    } finally {
      setLoading(false);
    }
  }, [loadMine, loadTeam]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleApply(e) {
    e.preventDefault();
    setError('');
    if (!form.startDate || !form.endDate) {
      setError('Please select both a start and end date');
      return;
    }
    setSaving(true);
    try {
      await api.post('/leaves', { ...form, employeeId: user.employeeId });
      showToast('Leave request submitted');
      setApplyOpen(false);
      setForm(EMPTY_FORM);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSaving(false);
    }
  }

  async function submitReview(status) {
    setReviewing(true);
    try {
      await api.patch(`/leaves/${reviewTarget.id}/review`, { status, comment: reviewComment });
      showToast(`Leave request ${status.toLowerCase()}`);
      setReviewTarget(null);
      setReviewComment('');
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to review request', 'error');
    } finally {
      setReviewing(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Leave Management</h1>
          <p>Apply for time off and manage approvals</p>
        </div>
        {hasOwnRecord && (
          <button className="btn btn-primary" onClick={() => setApplyOpen(true)} type="button">
            <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Apply for Leave
          </button>
        )}
      </header>

      {hasOwnRecord && canReview && (
        <div className="tab-strip">
          <button className={`tab-btn${tab === 'mine' ? ' active' : ''}`} onClick={() => setTab('mine')} type="button">My Leaves</button>
          <button className={`tab-btn${tab === 'team' ? ' active' : ''}`} onClick={() => setTab('team')} type="button">Team Requests</button>
        </div>
      )}

      {loading ? <Spinner label="Loading leave data…" /> : (
        <>
          {(tab === 'mine' || !canReview) && hasOwnRecord && (
            <section className="table-card">
              <div className="table-toolbar"><h3 style={{ margin: 0 }}>My Leave History</h3></div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th>Reviewed By</th></tr>
                  </thead>
                  <tbody>
                    {myLeaves.map((l) => (
                      <tr key={l.id}>
                        <td>{l.leaveType}</td>
                        <td>{l.startDate} → {l.endDate}</td>
                        <td>{l.days}</td>
                        <td>{l.reason || '—'}</td>
                        <td><Badge tone={STATUS_TONE[l.status]}>{l.status}</Badge></td>
                        <td>{l.reviewedBy || '—'}</td>
                      </tr>
                    ))}
                    {myLeaves.length === 0 && (
                      <tr><td colSpan={6}><div className="empty-state"><h3>No leave requests yet</h3><p>Apply for leave to see it here.</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {(tab === 'team' || (!hasOwnRecord && canReview)) && canReview && (
            <section className="table-card">
              <div className="table-toolbar">
                <h3 style={{ margin: 0 }}>Team Requests</h3>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th><th className="actions-col">Actions</th></tr>
                  </thead>
                  <tbody>
                    {teamLeaves.map((l) => (
                      <tr key={l.id}>
                        <td>{l.employeeName} <span className="employee-code">{l.employeeCode}</span></td>
                        <td>{l.leaveType}</td>
                        <td>{l.startDate} → {l.endDate}</td>
                        <td>{l.days}</td>
                        <td>{l.reason || '—'}</td>
                        <td><Badge tone={STATUS_TONE[l.status]}>{l.status}</Badge></td>
                        <td>
                          {l.status === 'PENDING' ? (
                            <button className="btn btn-secondary btn-sm" onClick={() => setReviewTarget(l)} type="button">Review</button>
                          ) : (
                            <span className="muted-text">{l.reviewedBy}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {teamLeaves.length === 0 && (
                      <tr><td colSpan={7}><div className="empty-state"><h3>No requests found</h3><p>Nothing matches the current filter.</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      <Modal
        open={applyOpen}
        onClose={() => { setApplyOpen(false); setError(''); }}
        title="Apply for Leave"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setApplyOpen(false)} type="button">Cancel</button>
            <button className="btn btn-primary" type="submit" form="leave-form" disabled={saving}>
              {saving ? 'Submitting…' : 'Submit Request'}
            </button>
          </>
        }
      >
        <form id="leave-form" onSubmit={handleApply} noValidate>
          {error && <div className="auth-error" style={{ marginBottom: 14 }}>{error}</div>}
          <div className="form-grid form-grid-1">
            <div className="form-field">
              <label>Leave Type</label>
              <select value={form.leaveType} onChange={(e) => setForm((f) => ({ ...f, leaveType: e.target.value }))}>
                <option value="CASUAL">Casual</option>
                <option value="SICK">Sick</option>
                <option value="EARNED">Earned</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label>Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="form-field">
              <label>Reason</label>
              <input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Optional" />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!reviewTarget}
        onClose={() => { setReviewTarget(null); setReviewComment(''); }}
        title="Review Leave Request"
        size="sm"
        footer={
          <>
            <button className="btn btn-danger" onClick={() => submitReview('REJECTED')} type="button" disabled={reviewing}>Reject</button>
            <button className="btn btn-primary" onClick={() => submitReview('APPROVED')} type="button" disabled={reviewing}>Approve</button>
          </>
        }
      >
        <p className="modal-body-text">
          {reviewTarget?.employeeName} requested {reviewTarget?.days} day(s) of {reviewTarget?.leaveType?.toLowerCase()} leave
          ({reviewTarget?.startDate} → {reviewTarget?.endDate}).
        </p>
        <div className="form-field">
          <label>Comment (optional)</label>
          <input value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Add a note for the employee" />
        </div>
      </Modal>
    </>
  );
}
