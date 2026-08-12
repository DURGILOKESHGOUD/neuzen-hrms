import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/axios';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

const today = new Date();
const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const TYPE_STYLE = {
  holiday: 'bg-purple-50 border-purple-200 text-purple-700',
  leave: 'bg-sky-50 border-sky-200 text-sky-700',
  onboarding: 'bg-emerald-50 border-emerald-200 text-emerald-700',
};

export default function CalendarPage() {
  const { user } = useAuth();
  const isManager = user?.role === 'admin' || user?.role === 'hr';
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', type: 'company', description: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/calendar/events', { params: { month, year } });
      setEvents(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/calendar/holidays', form);
      setShowForm(false);
      setForm({ name: '', date: '', type: 'company', description: '' });
      load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">{isManager ? 'HR Calendar' : 'Team Calendar'}</h1>
        <div className="flex gap-2">
          <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{MONTH_NAMES[m]}</option>
            ))}
          </select>
          <select className="input" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {isManager && (
            <button className="btn-primary whitespace-nowrap" onClick={() => setShowForm((s) => !s)}>
              {showForm ? 'Cancel' : '+ Add Holiday'}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">Add Company Holiday</h3>
          {formError && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>}
          <form onSubmit={handleAddHoliday} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Holiday Name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="public">Public</option>
                <option value="company">Company</option>
                <option value="optional">Optional</option>
              </select>
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Adding...' : 'Add Holiday'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <Loading label="Loading calendar..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : sorted.length === 0 ? (
        <EmptyState title="Nothing scheduled" message="No holidays, approved leaves, or onboarding events this month." />
      ) : (
        <div className="space-y-2">
          {sorted.map((ev) => (
            <div key={`${ev.type}-${ev.id}`} className={`card border ${TYPE_STYLE[ev.type] || 'bg-slate-50 border-slate-200'} flex items-center justify-between`}>
              <div>
                <p className="font-medium">{ev.title}</p>
                <p className="text-xs opacity-70 mt-0.5">
                  {new Date(ev.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {ev.endDate && ev.endDate !== ev.date ? ` – ${new Date(ev.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                </p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{ev.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
