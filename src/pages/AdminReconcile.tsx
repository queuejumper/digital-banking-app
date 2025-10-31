import { useEffect, useState } from "react";
import { reconcileRun, reconcileStatus } from "../api/client";
import type { ReconcileMismatch } from "../types";
import Toaster from "../components/Toast";
import { Link } from "react-router-dom";

export default function AdminReconcile() {
  const [mismatches, setMismatches] = useState<ReconcileMismatch[]>([]);
  const [checked, setChecked] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<string | null>(localStorage.getItem('reconcile:lastCheck'));
  const [toasts, setToasts] = useState<{ id: number; message: string; kind?: 'success' | 'warning' | 'error' | 'info' }[]>([]);

  async function refresh() {
    setLoading(true);
    try {
      const data = await reconcileStatus();
      setMismatches(data.mismatches || []);
      setChecked(data.checked || 0);
      const now = new Date().toISOString();
      setLastCheck(now); localStorage.setItem('reconcile:lastCheck', now);
    } finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div>
      <Toaster queue={toasts} />
      <nav className="mb-2 text-sm text-slate-600">
        <Link to="/admin" className="hover:underline">Admin</Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Reconcile</span>
      </nav>
      <h1 className="text-2xl font-semibold">Reconciliation</h1>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-sm text-slate-600">Last check: {lastCheck ? new Date(lastCheck).toLocaleString() : '—'}</div>
        <div className="flex items-center gap-2">
          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true)
              try {
                const data = await reconcileRun();
                setMismatches(data.mismatches || []);
                setChecked(data.checked || 0);
                const now = new Date().toISOString();
                setLastCheck(now); localStorage.setItem('reconcile:lastCheck', now);
                const n = data.mismatches?.length || 0;
                setToasts(t => [{ id: Date.now(), message: `Reconciliation completed: ${n} mismatches`, kind: n === 0 ? 'success' : 'warning' }, ...t].slice(0,3))
              } finally { setLoading(false); }
            }}
            className="rounded-md bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 disabled:opacity-70"
          >Run reconcile</button>
          <button disabled={loading} onClick={refresh} className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-100">Refresh status</button>
          <span className={`text-xs px-2 py-0.5 rounded-full ${mismatches.length === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>Mismatches ({mismatches.length})</span>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg bg-white shadow-sm my-3">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Account ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Currency</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Balance</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Computed</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Δ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {mismatches.map(m => (
              <tr key={m.accountId} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-sm font-mono text-slate-900">#{m.accountId}</td>
                <td className="px-4 py-2 text-sm text-slate-700">{m.currency}</td>
                <td className="px-4 py-2 text-sm text-right">{String(m.balanceMinor)}</td>
                <td className="px-4 py-2 text-sm text-right">{String(m.computedMinor)}</td>
                <td className={`px-4 py-2 text-sm text-right ${String(m.deltaMinor) === '0' ? '' : 'text-red-600'}`}>{String(m.deltaMinor)}</td>
              </tr>
            ))}
            {mismatches.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-sm text-emerald-700 bg-emerald-50">All good—no mismatches found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-slate-600">Checked: {checked}</p>
    </div>
  );
}


