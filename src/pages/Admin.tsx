import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { api, listUsers } from "../api/client";
import type { Account, KycStatus, User } from "../types";
import Alert from "../components/Alert";
import { Link, NavLink } from "react-router-dom";

export default function Admin() {
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPageSize, setUsersPageSize] = useState(10);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  

  async function fetchUsers(page: number) {
    setError(null);
    setLoading(true);
    try {
      const usersData = await listUsers(page, usersPageSize, userSearch || undefined);
      setUsers(usersData.items);
      setUsersTotal(usersData.total);
      setUsersPage(usersData.page);
      setUsersPageSize(usersData.pageSize);
      // Auto-select first user and load their accounts
      if (usersData.items.length > 0) {
        const first = usersData.items[0]
        setUserId(first.id)
        const { data } = await api.get<{ accounts: Account[] }>("/accounts", { params: { userId: first.id } })
        setAccounts(data.accounts)
      } else {
        setUserId("")
        setAccounts([])
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Failed to search");
    } finally {
      setLoading(false);
    }
  }

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    await fetchUsers(1)
  }

  useEffect(() => {
    // Auto-load first page on mount
    fetchUsers(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers(1)
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearch])


  return (
    <div>
      {error && <div className="mb-2"><Alert title="Error" onClose={() => setError(null)}>{error}</Alert></div>}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <div className="flex items-center gap-2 text-sm">
          <NavLink to="/admin" end className={({ isActive }) => `px-3 py-1.5 rounded-md ${isActive ? 'bg-emerald-600 text-white' : 'border border-slate-300 hover:bg-slate-100'}`}>Holders</NavLink>
          <NavLink to="/admin/reconcile" className={({ isActive }) => `px-3 py-1.5 rounded-md ${isActive ? 'bg-emerald-600 text-white' : 'border border-slate-300 hover:bg-slate-100'}`}>Reconcile</NavLink>
          <NavLink to="/admin/audit" className={({ isActive }) => `px-3 py-1.5 rounded-md ${isActive ? 'bg-emerald-600 text-white' : 'border border-slate-300 hover:bg-slate-100'}`}>Audit</NavLink>
        </div>
      </div>
      <form onSubmit={onSearch} className="flex gap-3 items-end my-3">
        <div>
          <label className="block text-sm text-gray-700">Search users</label>
          <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="email or id" className="mt-1 rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <button disabled={loading} className="rounded-md bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 disabled:opacity-70">{loading ? "Searching..." : "Search"}</button>
      </form>

      <h2 className="text-xl font-semibold">Users</h2>
      <div className="overflow-x-auto border rounded-lg bg-white shadow-sm my-2">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">KYC</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-sm font-medium text-slate-900">{u.email}</td>
                <td className="px-4 py-2 text-sm">
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs text-slate-700 bg-slate-100">
                    {u.kycStatus === 'VERIFIED' ? 'Verified' : u.kycStatus === 'PENDING' ? 'Pending review' : 'Rejected – please resubmit'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-2">
                    <Link to={`/admin/users/${u.id}`} className="px-2.5 py-1.5 rounded-md border border-slate-300 text-sm hover:bg-slate-100">View</Link>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-sm text-slate-600" colSpan={4}>No users</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {(usersTotal > usersPageSize) && (
        <div className="flex items-center gap-2">
          <button disabled={usersPage <= 1} onClick={() => fetchUsers(usersPage - 1)} className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100">Prev</button>
          <span className="text-sm">Page {usersPage}</span>
          <button disabled={usersPage * usersPageSize >= usersTotal} onClick={() => fetchUsers(usersPage + 1)} className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100">Next</button>
        </div>
      )}

      {/* Selected user accounts moved to user detail page */}

      {/* KYC section removed to avoid confusion; actions live in table */}

      {/* Reconciliation moved out of users list to reduce clutter */}
    </div>
  );
}


