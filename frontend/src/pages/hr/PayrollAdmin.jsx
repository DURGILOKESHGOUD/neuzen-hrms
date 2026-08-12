import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/axios';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';

const today = new Date();

export default function PayrollAdmin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [genError, setGenError] = useState('');
  const [genMessage, setGenMessage] = useState('');
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [payRes, empRes] = await Promise.all([
        api.get('/payroll', { params: { month, year } }),
        api.get('/employees', { params: { limit: 100 } }),
      ]);
      setRecords(payRes.data.data);
      setEmployees(empRes.data.data);
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

  const handleGenerateOne = async () => {
    if (!selectedEmployee) {
      setGenError('Select an employee first.');
      return;
    }
    setGenError('');
    setGenMessage('');
    setGenerating(true);
    try {
      await api.post('/payroll/generate', { employee: selectedEmployee, month, year });
      setGenMessage('Payslip generated successfully.');
      load();
    } catch (err) {
      setGenError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateBulk = async () => {
    setGenError('');
    setGenMessage('');
    setGenerating(true);
    try {
      const res = await api.post('/payroll/generate-bulk', { month, year });
      setGenMessage(res.data.message);
      load();
    } catch (err) {
      setGenError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await api.put(`/payroll/${id}/mark-paid`);
      load();
    } catch (err) {
      setGenError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Payroll</h1>
        <div className="flex gap-2">
          <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select className="input" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Generate Payroll</h3>
        {genError && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{genError}</div>}
        {genMessage && <div className="mb-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{genMessage}</div>}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[220px]">
            <label className="label">Employee</label>
            <select className="input" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
              <option value="">Select employee...</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>{e.name} ({e.employeeId})</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" disabled={generating} onClick={handleGenerateOne}>
            Generate for Selected
          </button>
          <button className="btn-secondary" disabled={generating} onClick={handleGenerateBulk}>
            Bulk Generate for All Active
          </button>
        </div>
      </div>

      {loading ? (
        <Loading label="Loading payroll records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : records.length === 0 ? (
        <EmptyState title="No payroll records" message="No payslips have been generated for this month yet." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Gross Pay</th>
                <th className="px-4 py-3">Deductions</th>
                <th className="px-4 py-3">LOP</th>
                <th className="px-4 py-3">Net Pay</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{r.employee?.name}</td>
                  <td className="px-4 py-3">₹{r.grossPay.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">₹{r.deductions.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">₹{r.lopAmount.toLocaleString('en-IN')} ({r.lopDays}d)</td>
                  <td className="px-4 py-3 font-semibold">₹{r.netPay.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3"><Badge status={r.status} /></td>
                  <td className="px-4 py-3">
                    {r.status === 'generated' && (
                      <button className="text-brand-600 text-xs font-medium hover:underline" onClick={() => handleMarkPaid(r._id)}>
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
