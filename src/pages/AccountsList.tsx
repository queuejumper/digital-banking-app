import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Account } from "../types";
import Alert from "../components/Alert";

export default function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    const params: any = {};
    // staff/admin can filter by userId via query param; basic list for now
    const { data } = await api.get<{ accounts: Account[] }>("/accounts", { params });
    setAccounts(data.accounts);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const { data } = await api.post<{ account: Account }>("/accounts", { currency });
      setAccounts((prev) => [data.account, ...prev]);
      setSuccess('Account created');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <div className="mb-2"><Alert title="Error" onClose={() => setError(null)}>{error}</Alert></div>}
      {success && <div className="mb-2"><Alert variant="success" title="Success" onClose={() => setSuccess(null)}>{success}</Alert></div>}
      <h1 className="text-2xl font-semibold">Accounts</h1>
      <form onSubmit={onCreate} className="flex gap-3 items-end my-3">
        <div>
          <label className="block text-sm text-gray-700">Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 rounded-md border border-gray-300 px-3 py-2">
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
          </select>
        </div>
        <button disabled={loading} className="rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-70">
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
      <ul className="grid gap-3">
        {accounts.map((a) => (
          <li key={a.id} className="border rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{a.currency} <span className="ml-2 text-xs inline-block rounded bg-gray-100 px-2 py-0.5 text-gray-700">{a.status}</span></div>
                <div className="text-sm text-gray-700">Balance: {a.balanceMinor}</div>
                <div className="text-xs text-gray-500">#{a.id}</div>
              </div>
              <Link to={`/accounts/${a.id}`} className="text-blue-600 hover:underline">View</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


