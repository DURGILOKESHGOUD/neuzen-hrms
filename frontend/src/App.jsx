import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Loading from './components/Loading';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';

import Employees from './pages/admin/Employees';
import Onboarding from './pages/hr/Onboarding';
import AttendanceAdmin from './pages/hr/AttendanceAdmin';
import LeaveApprovals from './pages/hr/LeaveApprovals';
import PayrollAdmin from './pages/hr/PayrollAdmin';

import AttendanceEmployee from './pages/employee/AttendanceEmployee';
import LeaveEmployee from './pages/employee/LeaveEmployee';
import PayslipsEmployee from './pages/employee/PayslipsEmployee';

function Shell({ children }) {
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <Loading label="Loading NEUZEN AI HRMS..." />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Shell><Dashboard /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employees"
        element={
          <ProtectedRoute roles={['admin', 'hr']}>
            <Shell><Employees /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute roles={['admin', 'hr']}>
            <Shell><Onboarding /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <Shell>
              {user?.role === 'employee' ? <AttendanceEmployee /> : <AttendanceAdmin />}
            </Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leaves"
        element={
          <ProtectedRoute>
            <Shell>
              {user?.role === 'employee' ? <LeaveEmployee /> : <LeaveApprovals />}
            </Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payroll"
        element={
          <ProtectedRoute roles={['admin', 'hr']}>
            <Shell><PayrollAdmin /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payslips"
        element={
          <ProtectedRoute roles={['employee']}>
            <Shell><PayslipsEmployee /></Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Shell><CalendarPage /></Shell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
