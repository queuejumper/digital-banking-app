import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listAudit } from "../api/client";
import type { AuditLog } from "../types";
import Alert from "../components/Alert";
import { Link } from "react-router-dom";

const ACTIONS = ["ACCOUNT_CREATE","ACCOUNT_CLOSE","KYC_SUBMIT","KYC_SET_STATUS","DEPOSIT","WITHDRAW","FX_CONVERT"];

export default function AdminAudit() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(Number(searchParams.get('page') || 1));
  const [pageSize, setPageSize] = useState(Number(searchParams.get('pageSize') || 20));
  const [total, setTotal] = useState(0);
  const [actorId, setActorId] = useState(searchParams.get('actorId') || "");
  const [action, setAction] = useState(searchParams.get('action') || "");
  const [from, setFrom] = useState(searchParams.get('from') || "");
  const [to, setTo] = useState(searchParams.get('to') || "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function syncQuery(p = page) {
    const next = new URLSearchParams();
    if (actorId) next.set('actorId', actorId);
    if (action) next.set('action', action);
    if (from) next.set('from', from);
    if (to) next.set('to', to);
    next.set('page', String(p));
    next.set('pageSize', String(pageSize));
    setSearchParams(next, { replace: true });
  }

  async function load(p = page) {
    setLoading(true); setError(null);
    try {
      const data = await listAudit({ actorId: actorId || undefined, action: action || undefined, from: from || undefined, to: to || undefined, page: p, pageSize });
      setItems(data.items); setTotal(data.total); setPage(data.page); setPageSize(data.pageSize);
      syncQuery(data.page);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load audit');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(1) }, []);

  return (
    <div>
      {error && <div className="mb-2"><Alert title="Error" onClose={() => setError(null)}>{error}</Alert></div>}
      <nav className="mb-2 text-sm text-slate-600">
        <Link to="/admin" className="hover:underline">Admin</Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Audit</span>
      </nav>
      <h1 className="text-2xl font-semibold">Audit</h1>
      <div className="my-3 grid gap-3 md:flex md:items-end">
        <div>
          <label className="block text-sm text-slate-700">Actor ID</label>
          <input className="mt-1 rounded-md border border-slate-300 px-3 py-2" value={actorId} onChange={(e) => setActorId(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-slate-700">Action</label>
          <select className="mt-1 rounded-md border border-slate-300 px-3 py-2" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">Any</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-700">From</label>
          <input type="date" className="mt-1 rounded-md border border-slate-300 px-3 py-2" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-slate-700">To</label>
          <input type="date" className="mt-1 rounded-md border border-slate-300 px-3 py-2" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <button onClick={() => load(1)} className="rounded-md bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700">Apply</button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Created</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actor</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Action</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Resource</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map(i => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-sm text-slate-700">{new Date(i.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-sm font-mono">{i.actorId}</td>
                <td className="px-4 py-2 text-sm">{i.action}</td>
                <td className="px-4 py-2 text-sm">{i.resource}</td>
                <td className="px-4 py-2 text-sm text-slate-700"><pre className="whitespace-pre-wrap break-words">{JSON.stringify(i.metadata)}</pre></td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-3 text-sm text-slate-600">No audit logs</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(total > pageSize) && (
        <div className="flex items-center gap-2 mt-2">
          <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100">Prev</button>
          <span className="text-sm">Page {page}</span>
          <button disabled={page * pageSize >= total} onClick={() => load(page + 1)} className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100">Next</button>
        </div>
      )}
    </div>
  );
}


