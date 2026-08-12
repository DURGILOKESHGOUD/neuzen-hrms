import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../api/axios';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import Badge from '../components/Badge';

function StatCard({ label, value, sub }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function AdminHrDashboard() {
  const [state, setState] = useState({ loading: true, error: '', data: null });

  const load = async () => {
    setState({ loading: true, error: '', data: null });
    try {
      const [empRes, leaveRes, offerRes] = await Promise.all([
        api.get('/employees', { params: { limit: 5 } }),
        api.get('/leaves', { params: { status: 'pending' } }),
        api.get('/onboarding/offer-letters', { params: { status: 'sent' } }),
      ]);
      setState({
        loading: false,
        error: '',
        data: {
          totalEmployees: empRes.data.meta.total,
          recentEmployees: empRes.data.data,
          pendingLeaves: leaveRes.data.data,
          pendingOffers: offerRes.data.data,
        },
      });
    } catch (err) {
      setState({ loading: false, error: getErrorMessage(err), data: null });
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (state.loading) return <Loading label="Loading dashboard..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;

  const { totalEmployees, recentEmployees, pendingLeaves, pendingOffers } = state.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Employees" value={totalEmployees} />
        <StatCard label="Pending Leave Requests" value={pendingLeaves.length} sub="Awaiting your review" />
        <StatCard label="Pending Offer Letters" value={pendingOffers.length} sub="Awaiting candidate response" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-3">Recently Added Employees</h3>
          {recentEmployees.length === 0 ? (
            <p className="text-sm text-slate-400">No employees added yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentEmployees.map((e) => (
                <li key={e._id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-700">{e.name}</p>
                    <p className="text-xs text-slate-400">{e.designation} · {e.department}</p>
                  </div>
                  <Badge status={e.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">Pending Leave Requests</h3>
          {pendingLeaves.length === 0 ? (
            <p className="text-sm text-slate-400">No pending leave requests. All caught up!</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingLeaves.slice(0, 5).map((l) => (
                <li key={l._id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-700">{l.employee?.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{l.leaveType} · {l.days} day(s)</p>
                  </div>
                  <Badge status={l.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: '', data: null });

  const load = async () => {
    setState({ loading: true, error: '', data: null });
    try {
      const [meRes, attRes, leaveRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/attendance/me', { params: { month: new Date().getMonth() + 1, year: new Date().getFullYear() } }),
        api.get('/leaves/me'),
      ]);
      setState({
        loading: false,
        error: '',
        data: {
          profile: meRes.data.data.employeeProfile,
          attendance: attRes.data.data,
          leaves: leaveRes.data.data,
        },
      });
    } catch (err) {
      setState({ loading: false, error: getErrorMessage(err), data: null });
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (state.loading) return <Loading label="Loading your dashboard..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;

  const { profile, attendance, leaves } = state.data;
  const presentDays = attendance.filter((a) => a.status === 'present').length;
  const pendingLeaves = leaves.filter((l) => l.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
        <p className="text-sm text-slate-500 mt-1">
          {profile ? `${profile.designation} · ${profile.department}` : 'No employee profile linked yet — contact HR.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Present Days (this month)" value={presentDays} />
        <StatCard label="Pending Leave Requests" value={pendingLeaves} />
        <StatCard
          label="Casual Leave Balance"
          value={profile?.leaveBalance?.casual ?? '-'}
          sub={`Sick: ${profile?.leaveBalance?.sick ?? '-'} · Earned: ${profile?.leaveBalance?.earned ?? '-'}`}
        />
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Recent Leave Requests</h3>
        {leaves.length === 0 ? (
          <p className="text-sm text-slate-400">You haven't applied for any leave yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {leaves.slice(0, 5).map((l) => (
              <li key={l._id} className="py-2 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-700 capitalize">{l.leaveType} leave</p>
                  <p className="text-xs text-slate-400">
                    {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge status={l.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'employee') return <EmployeeDashboard />;
  return <AdminHrDashboard />;
}
