import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/axios';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';

const emptyForm = {
  name: '', email: '', password: '', phone: '', department: '', designation: '',
  dateOfJoining: '', employmentType: 'full-time', role: 'employee',
  basic: '', hra: '', allowances: '', deductions: '',
};

export default function Employees() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async (searchTerm = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/employees', { params: { search: searchTerm, limit: 50 } });
      setEmployees(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(search);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/employees', {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        department: form.department,
        designation: form.designation,
        dateOfJoining: form.dateOfJoining,
        employmentType: form.employmentType,
        role: form.role,
        salary: {
          basic: Number(form.basic) || 0,
          hra: Number(form.hra) || 0,
          allowances: Number(form.allowances) || 0,
          deductions: Number(form.deductions) || 0,
        },
      });
      setShowForm(false);
      setForm(emptyForm);
      load(search);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Employees</h1>
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              className="input"
              placeholder="Search by name, email, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn-secondary" type="submit">Search</button>
          </form>
          <button className="btn-primary whitespace-nowrap" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ Add Employee'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">Add New Employee</h3>
          {formError && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Temporary Password</label>
              <input type="text" className="input" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="label">Designation</label>
              <input className="input" required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
            <div>
              <label className="label">Date of Joining</label>
              <input type="date" className="input" required value={form.dateOfJoining} onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })} />
            </div>
            <div>
              <label className="label">Employment Type</label>
              <select className="input" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </div>
            {user?.role === 'admin' && (
              <div>
                <label className="label">Account Role</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
            <div>
              <label className="label">Basic (monthly)</label>
              <input type="number" className="input" value={form.basic} onChange={(e) => setForm({ ...form, basic: e.target.value })} />
            </div>
            <div>
              <label className="label">HRA (monthly)</label>
              <input type="number" className="input" value={form.hra} onChange={(e) => setForm({ ...form, hra: e.target.value })} />
            </div>
            <div>
              <label className="label">Allowances (monthly)</label>
              <input type="number" className="input" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} />
            </div>
            <div>
              <label className="label">Deductions (monthly)</label>
              <input type="number" className="input" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Creating...' : 'Create Employee'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <Loading label="Loading employees..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load(search)} />
      ) : employees.length === 0 ? (
        <EmptyState title="No employees found" message="Add your first employee to get started." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((e) => (
                <tr key={e._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.employeeId}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{e.name}</td>
                  <td className="px-4 py-3">{e.department}</td>
                  <td className="px-4 py-3">{e.designation}</td>
                  <td className="px-4 py-3">{new Date(e.dateOfJoining).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><Badge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
