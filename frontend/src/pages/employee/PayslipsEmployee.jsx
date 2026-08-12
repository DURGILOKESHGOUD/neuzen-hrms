import React, { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/axios';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PayslipsEmployee() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payslips, setPayslips] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/payroll/me');
      setPayslips(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">My Payslips</h1>

      {loading ? (
        <Loading label="Loading payslips..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : payslips.length === 0 ? (
        <EmptyState title="No payslips yet" message="Your payslips will appear here once HR generates payroll for you." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Net Pay</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payslips.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{MONTH_NAMES[p.month]} {p.year}</td>
                    <td className="px-4 py-3 font-semibold">₹{p.netPay.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><Badge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <button className="text-brand-600 text-xs font-medium hover:underline" onClick={() => setSelected(p)}>
                        View Breakdown
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            {!selected ? (
              <p className="text-sm text-slate-400">Select a payslip to view the full breakdown.</p>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{MONTH_NAMES[selected.month]} {selected.year}</h3>
                  <Badge status={selected.status} />
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="py-1.5 text-slate-500">Basic</td><td className="py-1.5 text-right">₹{selected.basic.toLocaleString('en-IN')}</td></tr>
                    <tr><td className="py-1.5 text-slate-500">HRA</td><td className="py-1.5 text-right">₹{selected.hra.toLocaleString('en-IN')}</td></tr>
                    <tr><td className="py-1.5 text-slate-500">Allowances</td><td className="py-1.5 text-right">₹{selected.allowances.toLocaleString('en-IN')}</td></tr>
                    <tr><td className="py-1.5 text-slate-500 font-medium">Gross Pay</td><td className="py-1.5 text-right font-medium">₹{selected.grossPay.toLocaleString('en-IN')}</td></tr>
                    <tr><td className="py-1.5 text-slate-500">Deductions</td><td className="py-1.5 text-right text-red-600">- ₹{selected.deductions.toLocaleString('en-IN')}</td></tr>
                    <tr><td className="py-1.5 text-slate-500">Loss of Pay ({selected.lopDays}d)</td><td className="py-1.5 text-right text-red-600">- ₹{selected.lopAmount.toLocaleString('en-IN')}</td></tr>
                    <tr className="border-t-2 border-slate-200"><td className="py-2 font-bold">Net Pay</td><td className="py-2 text-right font-bold text-brand-600">₹{selected.netPay.toLocaleString('en-IN')}</td></tr>
                  </tbody>
                </table>
                <button className="btn-secondary text-xs w-full mt-4" onClick={() => window.print()}>
                  Print / Save as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
