import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: '',
  address: '', departmentId: '', position: '', salary: '', dateOfJoining: '', managerId: '', photoUrl: '',
};

const STATUS_TONE = { ACTIVE: 'success', ON_LEAVE: 'warning', TERMINATED: 'danger' };

export default function Employees() {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const canEdit = hasRole('ADMIN', 'MANAGER');
  const canDelete = hasRole('ADMIN');

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [departments, setDepartments] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadDepartments = useCallback(async () => {
    const { data } = await api.get('/departments');
    setDepartments(data);
  }, []);

  const loadAllEmployees = useCallback(async () => {
    const { data } = await api.get('/employees/all');
    setAllEmployees(data);
  }, []);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/employees', {
        params: { query: query || undefined, departmentId: departmentId || undefined, status: status || undefined, page, size: 8 },
      });
      setRows(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      showToast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  }, [query, departmentId, status, page, showToast]);

  useEffect(() => { loadDepartments(); loadAllEmployees(); }, [loadDepartments, loadAllEmployees]);
  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditingId(null);
    setPhotoFile(null);
    setPhotoPreview('');
  }

  function openAddModal() {
    resetForm();
    setModalOpen(true);
  }

  function openEditModal(emp) {
    setForm({
      firstName: emp.firstName, lastName: emp.lastName, email: emp.email, phone: emp.phone || '',
      dateOfBirth: emp.dateOfBirth || '', gender: emp.gender || '', address: emp.address || '',
      departmentId: emp.departmentId || '', position: emp.position, salary: emp.salary,
      dateOfJoining: emp.dateOfJoining, managerId: emp.managerId || '', photoUrl: emp.photoUrl || '',
    });
    setPhotoPreview(emp.photoUrl ? emp.photoUrl : '');
    setErrors({});
    setEditingId(emp.id);
    setModalOpen(true);
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function validate() {
    const req = ['firstName', 'lastName', 'email', 'phone', 'departmentId', 'position', 'salary', 'dateOfJoining'];
    const next = {};
    req.forEach((f) => {
      if (!form[f]) next[f] = 'This field is required';
    });
    if (form.salary && Number(form.salary) <= 0) next.salary = 'Salary must be positive';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        departmentId: Number(form.departmentId),
        managerId: form.managerId ? Number(form.managerId) : null,
        salary: Number(form.salary),
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
      };

      let savedId = editingId;
      if (editingId) {
        await api.put(`/employees/${editingId}`, payload);
      } else {
        const { data } = await api.post('/employees', payload);
        savedId = data.id;
      }

      if (photoFile && savedId) {
        const fd = new FormData();
        fd.append('file', photoFile);
        await api.post(`/employees/${savedId}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      showToast(editingId ? 'Employee updated' : 'Employee added');
      setModalOpen(false);
      resetForm();
      loadEmployees();
      loadAllEmployees();
    } catch (err) {
      if (err.response?.data?.fieldErrors) {
        setErrors(err.response.data.fieldErrors);
      }
      showToast(err.response?.data?.message || 'Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/employees/${deleteTarget.id}`);
      showToast('Employee deleted');
      setDeleteTarget(null);
      loadEmployees();
      loadAllEmployees();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete employee', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function handleExport() {
    const res = await api.get('/employees/export/csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'employees.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function initials(first, last) {
    return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Employees</h1>
          <p>{totalElements} total employees across the organization</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-secondary" onClick={handleExport} type="button">
            <svg viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0-4-4m4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            Export CSV
          </button>
          {canEdit && (
            <button className="btn btn-primary" onClick={openAddModal} type="button">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Add Employee
            </button>
          )}
        </div>
      </header>

      <section className="table-card">
        <div className="table-toolbar">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <input type="text" placeholder="Search by name, email, code, or position…" value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }} />
          </div>
          <select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPage(0); }}>
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>

        {loading ? (
          <Spinner label="Loading employees…" />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Contact</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Salary</th>
                    <th>Status</th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div className="employee-cell">
                          {e.photoUrl ? (
                            <img className="avatar" src={e.photoUrl} alt="" />
                          ) : (
                            <div className="avatar avatar-fallback">{initials(e.firstName, e.lastName)}</div>
                          )}
                          <div>
                            <Link to={`/employees/${e.id}`} className="employee-name-link">{e.firstName} {e.lastName}</Link>
                            <div className="employee-code">{e.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{e.email}</div>
                        <span className="contact-phone">{e.phone}</span>
                      </td>
                      <td><span className="badge badge-default">{e.departmentName}</span></td>
                      <td>{e.position}</td>
                      <td className="salary-cell">${Number(e.salary).toLocaleString()}</td>
                      <td><Badge tone={STATUS_TONE[e.status]}>{e.status.replace('_', ' ')}</Badge></td>
                      <td>
                        <div className="row-actions">
                          <Link className="icon-btn" to={`/employees/${e.id}`} title="View profile">
                            <svg viewBox="0 0 24 24" fill="none"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                          </Link>
                          {canEdit && (
                            <button className="icon-btn" onClick={() => openEditModal(e)} title="Edit" type="button">
                              <svg viewBox="0 0 24 24" fill="none"><path d="M12 20h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                            </button>
                          )}
                          {canDelete && (
                            <button className="icon-btn danger" onClick={() => setDeleteTarget(e)} title="Delete" type="button">
                              <svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={7}><div className="empty-state"><h3>No employees found</h3><p>Try adjusting your search or filters.</p></div></td></tr>
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

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingId ? 'Edit Employee' : 'Add Employee'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setModalOpen(false); resetForm(); }} type="button">Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} type="submit" form="employee-form" disabled={saving}>
              {saving ? 'Saving…' : 'Save Employee'}
            </button>
          </>
        }
      >
        <form id="employee-form" onSubmit={handleSubmit} noValidate>
          <div className="photo-upload-row">
            {photoPreview ? <img src={photoPreview} alt="" className="photo-preview" /> : <div className="photo-preview photo-preview-empty">Photo</div>}
            <label className="btn btn-secondary btn-sm">
              Upload Photo
              <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handlePhotoSelect} />
            </label>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>First Name</label>
              <input value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} className={errors.firstName ? 'invalid' : ''} />
              <span className="error-msg">{errors.firstName}</span>
            </div>
            <div className="form-field">
              <label>Last Name</label>
              <input value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} className={errors.lastName ? 'invalid' : ''} />
              <span className="error-msg">{errors.lastName}</span>
            </div>

            <div className="form-field span-2">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className={errors.email ? 'invalid' : ''} />
              <span className="error-msg">{errors.email}</span>
            </div>

            <div className="form-field">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="555-0100" className={errors.phone ? 'invalid' : ''} />
              <span className="error-msg">{errors.phone}</span>
            </div>
            <div className="form-field">
              <label>Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
            </div>

            <div className="form-field">
              <label>Gender</label>
              <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                <option value="">Select…</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="form-field">
              <label>Department</label>
              <select value={form.departmentId} onChange={(e) => handleChange('departmentId', e.target.value)} className={errors.departmentId ? 'invalid' : ''}>
                <option value="">Select…</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <span className="error-msg">{errors.departmentId}</span>
            </div>

            <div className="form-field">
              <label>Position</label>
              <input value={form.position} onChange={(e) => handleChange('position', e.target.value)} className={errors.position ? 'invalid' : ''} />
              <span className="error-msg">{errors.position}</span>
            </div>
            <div className="form-field">
              <label>Annual Salary ($)</label>
              <input type="number" min="0" step="1000" value={form.salary} onChange={(e) => handleChange('salary', e.target.value)} className={errors.salary ? 'invalid' : ''} />
              <span className="error-msg">{errors.salary}</span>
            </div>

            <div className="form-field">
              <label>Date of Joining</label>
              <input type="date" value={form.dateOfJoining} onChange={(e) => handleChange('dateOfJoining', e.target.value)} className={errors.dateOfJoining ? 'invalid' : ''} />
              <span className="error-msg">{errors.dateOfJoining}</span>
            </div>
            <div className="form-field">
              <label>Reports To (Manager)</label>
              <select value={form.managerId} onChange={(e) => handleChange('managerId', e.target.value)}>
                <option value="">No manager</option>
                {allEmployees.filter((m) => m.id !== editingId).map((m) => (
                  <option key={m.id} value={m.id}>{m.firstName} {m.lastName} — {m.position}</option>
                ))}
              </select>
            </div>

            <div className="form-field span-2">
              <label>Address</label>
              <input value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${deleteTarget?.firstName} ${deleteTarget?.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </>
  );
}
