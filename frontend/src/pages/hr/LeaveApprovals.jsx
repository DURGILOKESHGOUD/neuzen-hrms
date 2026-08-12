import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/axios';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';

export default function LeaveApprovals() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [comment, setComment] = useState({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/leaves', { params: filter ? { status: filter } : {} });
      setLeaves(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleReview = async (id, status) => {
    setActionError('');
    setBusyId(id);
    try {
      await api.put(`/leaves/${id}/review`, { status, comment: comment[id] || '' });
      load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Leave Approvals</h1>
        <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      {actionError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{actionError}</div>
      )}

      {loading ? (
        <Loading label="Loading leave requests..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : leaves.length === 0 ? (
        <EmptyState title="No leave requests" message="There are no leave requests matching this filter." />
      ) : (
        <div className="space-y-3">
          {leaves.map((l) => (
            <div key={l._id} className="card">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="font-medium text-slate-700">
                    {l.employee?.name} <span className="text-slate-400 font-normal text-xs">· {l.employee?.employeeId}</span>
                  </p>
                  <p className="text-sm text-slate-500 capitalize mt-1">
                    {l.leaveType} leave · {l.days} day(s) · {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">"{l.reason}"</p>
                  {l.reviewComment && <p className="text-xs text-slate-400 mt-1">HR note: {l.reviewComment}</p>}
                </div>
                <Badge status={l.status} />
              </div>

              {l.status === 'pending' && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <input
                    className="input flex-1 min-w-[180px]"
                    placeholder="Optional comment"
                    value={comment[l._id] || ''}
                    onChange={(e) => setComment({ ...comment, [l._id]: e.target.value })}
                  />
                  <button className="btn-success text-xs" disabled={busyId === l._id} onClick={() => handleReview(l._id, 'approved')}>
                    Approve
                  </button>
                  <button className="btn-danger text-xs" disabled={busyId === l._id} onClick={() => handleReview(l._id, 'rejected')}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
