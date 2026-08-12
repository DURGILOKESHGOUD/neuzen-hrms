import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = {
  admin: [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/employees', label: 'Employees' },
    { to: '/onboarding', label: 'Onboarding' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/leaves', label: 'Leave Approvals' },
    { to: '/payroll', label: 'Payroll' },
    { to: '/calendar', label: 'Calendar' },
  ],
  hr: [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/employees', label: 'Employees' },
    { to: '/onboarding', label: 'Onboarding' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/leaves', label: 'Leave Approvals' },
    { to: '/payroll', label: 'Payroll' },
    { to: '/calendar', label: 'Calendar' },
  ],
  employee: [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/attendance', label: 'My Attendance' },
    { to: '/leaves', label: 'My Leaves' },
    { to: '/payslips', label: 'Payslips' },
    { to: '/calendar', label: 'Team Calendar' },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV_ITEMS[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform md:translate-x-0 md:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center px-5 border-b border-slate-200">
          <span className="text-lg font-bold text-brand-600">NEUZEN AI</span>
          <span className="ml-2 text-xs text-slate-400">HRMS</span>
        </div>
        <nav className="p-3 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
          <button className="md:hidden text-slate-600" onClick={() => setMobileOpen(true)}>
            ☰
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-semibold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <button onClick={handleLogout} className="btn-secondary text-xs">
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
