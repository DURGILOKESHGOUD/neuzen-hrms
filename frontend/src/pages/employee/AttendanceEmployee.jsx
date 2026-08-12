import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/axios';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';

const today = new Date();

export default function AttendanceEmployee() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [records, setRecords] = useState([]);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/attendance/me', { params: { month: today.getMonth() + 1, year: today.getFullYear() } });
      setRecords(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const todayStr = today.toISOString().slice(0, 10);
  const todayRecord = records.find((r) => r.date === todayStr);

  const handleCheckIn = async () => {
    setActionError('');
    setActionLoading(true);
    try {
      await api.post('/attendance/check-in');
      load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionError('');
    setActionLoading(true);
    try {
      await api.post('/attendance/check-out');
      load();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">My Attendance</h1>

      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-slate-500">Today, {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <p className="text-sm mt-1">
              {todayRecord?.checkIn ? (
                <>Checked in at <span className="font-medium">{new Date(todayRecord.checkIn).toLocaleTimeString()}</span></>
              ) : (
                'You have not checked in today.'
              )}
              {todayRecord?.checkOut && (
                <> · Checked out at <span className="font-medium">{new Date(todayRecord.checkOut).toLocaleTimeString()}</span></>
              )}
            </p>
            {actionError && <p className="text-xs text-red-600 mt-1">{actionError}</p>}
          </div>
          <div className="flex gap-2">
            <button className="btn-success" disabled={actionLoading || !!todayRecord?.checkIn} onClick={handleCheckIn}>
              Check In
            </button>
            <button
              className="btn-secondary"
              disabled={actionLoading || !todayRecord?.checkIn || !!todayRecord?.checkOut}
              onClick={handleCheckOut}
            >
              Check Out
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <Loading label="Loading attendance history..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : records.length === 0 ? (
        <EmptyState title="No attendance yet" message="Check in today to start building your attendance history." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Check-in</th>
                <th className="px-4 py-3">Check-out</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{r.date}</td>
                  <td className="px-4 py-3">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '—'}</td>
                  <td className="px-4 py-3">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '—'}</td>
                  <td className="px-4 py-3">{r.workHours || '—'}</td>
                  <td className="px-4 py-3"><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
