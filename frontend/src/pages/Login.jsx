import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-600">NEUZEN AI</h1>
          <p className="text-slate-500 text-sm mt-1">Human Resource Management System</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Sign in</h2>

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@neuzenai.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-2">Demo accounts (seeded via `npm run seed`):</p>
            <div className="grid grid-cols-3 gap-2">
              <button className="btn-secondary text-xs" onClick={() => fillDemo('admin@neuzenai.com', 'Admin@123')}>
                Admin
              </button>
              <button className="btn-secondary text-xs" onClick={() => fillDemo('hr@neuzenai.com', 'Hr@12345')}>
                HR
              </button>
              <button
                className="btn-secondary text-xs"
                onClick={() => fillDemo('employee@neuzenai.com', 'Employee@123')}
              >
                Employee
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
