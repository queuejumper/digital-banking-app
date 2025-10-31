import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, getUserDetail, resetUserTotp } from "../api/client";
import type { Account, KycStatus, User } from "../types";
import Alert from "../components/Alert";

export default function AdminUserDetail() {
  const { userId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await getUserDetail(userId);
      setUser(detail.user);
      const { data } = await api.get<{ accounts: Account[] }>("/accounts", { params: { userId } });
      setAccounts(data.accounts);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Failed to load user");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function updateKyc(next: KycStatus) {
    if (!user) return;
    const label = next === 'VERIFIED' ? 'Verify' : next === 'REJECTED' ? 'Reject' : 'Mark pending';
    if (!confirm(`${label} KYC for ${user.email}?`)) return;
    await api.patch(`/kyc/admin/${user.id}/status`, { status: next });
    setSuccess('KYC status updated'); setError(null);
    await load();
  }

  if (loading) return <p className="text-slate-600">Loading…</p>;
  if (error) return <Alert title="Error" onClose={() => setError(null)}>{error}</Alert>;
  if (!user) return <p className="text-slate-600">Not found</p>;

  return (
    <div>
      <nav className="mb-2 text-sm text-slate-600">
        <Link to="/admin" className="hover:underline">Admin</Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">User detail</span>
      </nav>
      {success && <div className="mb-2"><Alert variant="success" title="Success" onClose={() => setSuccess(null)}>{success}</Alert></div>}
      <h1 className="text-2xl font-semibold mb-3">User detail</h1>
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{user.email}</div>
            <div className="text-sm text-slate-600">ID: <span className="font-mono">{user.id}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-slate-100 text-slate-700">
              {user.kycStatus === 'VERIFIED' ? 'Verified' : user.kycStatus === 'PENDING' ? 'Pending review' : 'Rejected – please resubmit'}
            </span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${user.totpEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
              2FA: {user.totpEnabled ? 'Enabled' : 'Disabled'}
            </span>
            {user.kycStatus === 'PENDING' && (
              <>
                <button onClick={() => updateKyc('VERIFIED')} className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700">Verify</button>
                <button onClick={() => updateKyc('REJECTED')} className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700">Reject</button>
              </>
            )}
            {user.kycStatus === 'VERIFIED' && (
              <button onClick={() => updateKyc('PENDING')} className="px-3 py-1.5 rounded-md bg-slate-600 text-white text-sm hover:bg-slate-700">Mark pending</button>
            )}
            {user.kycStatus === 'REJECTED' && (
              <button onClick={() => updateKyc('PENDING')} className="px-3 py-1.5 rounded-md bg-slate-600 text-white text-sm hover:bg-slate-700">Mark pending</button>
            )}
            <button onClick={async () => { if (!confirm(`Reset 2FA for ${user.email}?`)) return; await resetUserTotp(user.id); setSuccess('2FA reset; user must reconfigure'); setError(null); await load(); }} className="px-3 py-1.5 rounded-md border border-slate-300 text-sm hover:bg-slate-100">Reset 2FA</button>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-4">Accounts</h2>
      <div className="overflow-x-auto border rounded-lg bg-white shadow-sm my-2">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Account</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Currency</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {accounts.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-sm text-slate-900 font-mono">#{a.id}</td>
                <td className="px-4 py-2 text-sm text-slate-700">{a.currency}</td>
                <td className="px-4 py-2 text-sm"><span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{a.status}</span></td>
                <td className="px-4 py-2 text-sm text-right">{a.balanceMinor}</td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-3 text-sm text-slate-600">No accounts</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


