import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/axios';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';

const emptyForm = { leaveType: 'casual', startDate: '', endDate: '', reason: '' };

export default function LeaveEmployee() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaves, setLeaves] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/leaves/me');
      setLeaves(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/leaves', form);
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.put(`/leaves/${id}/cancel`);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Leaves</h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ Apply for Leave'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">Apply for Leave</h3>
          {formError && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>
          )}
          <form onSubmit={handleApply} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Leave Type</label>
              <select className="input" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
                <option value="casual">Casual</option>
                <option value="sick">Sick</option>
                <option value="earned">Earned</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            <div />
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Reason</label>
              <textarea className="input" required rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <Loading label="Loading your leave requests..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : leaves.length === 0 ? (
        <EmptyState title="No leave requests" message="You haven't applied for any leave yet." />
      ) : (
        <div className="space-y-3">
          {leaves.map((l) => (
            <div key={l._id} className="card">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="font-medium text-slate-700 capitalize">{l.leaveType} leave · {l.days} day(s)</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">"{l.reason}"</p>
                  {l.reviewComment && <p className="text-xs text-slate-400 mt-1">HR note: {l.reviewComment}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge status={l.status} />
                  {l.status === 'pending' && (
                    <button className="text-xs text-red-600 hover:underline" onClick={() => handleCancel(l._id)}>
                      Cancel request
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
