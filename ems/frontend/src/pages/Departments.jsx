import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const EMPTY_FORM = { name: '', description: '', location: '', headId: '' };

export default function Departments() {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const isAdmin = hasRole('ADMIN');

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, empRes] = await Promise.all([api.get('/departments'), api.get('/employees/all')]);
      setDepartments(deptRes.data);
      setEmployees(empRes.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(d) {
    setForm({ name: d.name, description: d.description || '', location: d.location || '', headId: d.headId || '' });
    setErrors({});
    setEditingId(d.id);
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name) {
      setErrors({ name: 'Department name is required' });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, headId: form.headId ? Number(form.headId) : null };
      if (editingId) {
        await api.put(`/departments/${editingId}`, payload);
      } else {
        await api.post('/departments', payload);
      }
      showToast(editingId ? 'Department updated' : 'Department created');
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/departments/${deleteTarget.id}`);
      showToast('Department deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete department', 'error');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <Spinner label="Loading departments…" />;

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Departments</h1>
          <p>{departments.length} departments in your organization</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd} type="button">
            <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Add Department
          </button>
        )}
      </header>

      <section className="dept-grid">
        {departments.map((d) => (
          <div className="dept-card" key={d.id}>
            <div className="dept-card-header">
              <h3>{d.name}</h3>
              <span className="dept-count">{d.employeeCount} employees</span>
            </div>
            <p className="dept-desc">{d.description || 'No description provided.'}</p>
            <div className="dept-meta">
              <span><strong>Location:</strong> {d.location || '—'}</span>
              <span><strong>Head:</strong> {d.headName || 'Unassigned'}</span>
            </div>
            {isAdmin && (
              <div className="dept-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(d)} type="button">Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(d)} type="button">Delete</button>
              </div>
            )}
          </div>
        ))}
      </section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Department' : 'Add Department'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} type="button">Cancel</button>
            <button className="btn btn-primary" type="submit" form="department-form" disabled={saving}>
              {saving ? 'Saving…' : 'Save Department'}
            </button>
          </>
        }
      >
        <form id="department-form" onSubmit={handleSubmit} noValidate>
          <div className="form-grid form-grid-1">
            <div className="form-field">
              <label>Department Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={errors.name ? 'invalid' : ''} />
              <span className="error-msg">{errors.name}</span>
            </div>
            <div className="form-field">
              <label>Description</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-field">
              <label>Location</label>
              <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="form-field">
              <label>Department Head</label>
              <select value={form.headId} onChange={(e) => setForm((f) => ({ ...f, headId: e.target.value }))}>
                <option value="">Unassigned</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to delete ${deleteTarget?.name}? Departments with assigned employees cannot be deleted.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </>
  );
}
