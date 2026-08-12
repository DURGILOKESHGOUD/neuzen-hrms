import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/axios';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';

const emptyForm = { candidateName: '', candidateEmail: '', designation: '', department: '', ctc: '', joiningDate: '' };

export default function Onboarding() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offers, setOffers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState(null);
  const [onboardPassword, setOnboardPassword] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/onboarding/offer-letters');
      setOffers(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/onboarding/offer-letters', { ...form, ctc: Number(form.ctc) });
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (id, status) => {
    setActionError('');
    try {
      await api.put(`/onboarding/offer-letters/${id}/status`, { status });
      load();
      if (selected?._id === id) setSelected({ ...selected, status });
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleOnboard = async (id) => {
    if (!onboardPassword || onboardPassword.length < 6) {
      setActionError('Enter a temporary password (min 6 characters) for the new employee login.');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      await api.post(`/onboarding/offer-letters/${id}/onboard`, { password: onboardPassword });
      setOnboardPassword('');
      setSelected(null);
      load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Onboarding &amp; Offer Letters</h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ New Offer Letter'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">Generate Offer Letter</h3>
          {formError && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Candidate Name</label>
              <input className="input" required value={form.candidateName} onChange={(e) => setForm({ ...form, candidateName: e.target.value })} />
            </div>
            <div>
              <label className="label">Candidate Email</label>
              <input type="email" className="input" required value={form.candidateEmail} onChange={(e) => setForm({ ...form, candidateEmail: e.target.value })} />
            </div>
            <div>
              <label className="label">Designation</label>
              <input className="input" required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="label">Annual CTC (INR)</label>
              <input type="number" className="input" required value={form.ctc} onChange={(e) => setForm({ ...form, ctc: e.target.value })} />
            </div>
            <div>
              <label className="label">Joining Date</label>
              <input type="date" className="input" required value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Generating...' : 'Generate Offer Letter'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <Loading label="Loading offer letters..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : offers.length === 0 ? (
        <EmptyState title="No offer letters yet" message="Generate your first offer letter to begin onboarding a candidate." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joining</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offers.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{o.candidateName}</td>
                    <td className="px-4 py-3">{o.designation}</td>
                    <td className="px-4 py-3">{new Date(o.joiningDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><Badge status={o.status} /></td>
                    <td className="px-4 py-3">
                      <button className="text-brand-600 text-xs font-medium hover:underline" onClick={() => { setSelected(o); setActionError(''); }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            {!selected ? (
              <p className="text-sm text-slate-400">Select an offer letter to view details and take action.</p>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{selected.candidateName}</h3>
                  <Badge status={selected.status} />
                </div>
                <pre className="text-xs whitespace-pre-wrap bg-slate-50 rounded-lg p-3 max-h-64 overflow-y-auto border border-slate-100">
                  {selected.letterBody}
                </pre>

                {actionError && (
                  <p className="text-xs text-red-600 mt-2">{actionError}</p>
                )}

                <div className="flex gap-2 mt-3 flex-wrap">
                  {selected.status === 'sent' && (
                    <>
                      <button className="btn-success text-xs" onClick={() => handleStatus(selected._id, 'accepted')}>Mark Accepted</button>
                      <button className="btn-danger text-xs" onClick={() => handleStatus(selected._id, 'rejected')}>Mark Rejected</button>
                    </>
                  )}
                </div>

                {selected.status === 'accepted' && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <label className="label">Set temporary login password to onboard</label>
                    <input
                      type="text"
                      className="input mb-2"
                      placeholder="Min 6 characters"
                      value={onboardPassword}
                      onChange={(e) => setOnboardPassword(e.target.value)}
                    />
                    <button className="btn-primary text-xs w-full" disabled={actionLoading} onClick={() => handleOnboard(selected._id)}>
                      {actionLoading ? 'Onboarding...' : 'Complete Onboarding'}
                    </button>
                  </div>
                )}

                {selected.status === 'onboarded' && (
                  <p className="text-xs text-emerald-600 mt-3">✓ This candidate has been onboarded as an active employee.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
