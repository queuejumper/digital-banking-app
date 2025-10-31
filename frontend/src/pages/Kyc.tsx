import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { User } from "../types";
import Alert from "../components/Alert";

export default function KycPage() {
  const { user: currentUser, setAuth } = useAuth();
  const [user, setUser] = useState<User | null>(currentUser);
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get<{ user: User }>("/kyc/status");
        setUser(data.user);
      } catch (err) {
        // ignore
      }
    }
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const { data } = await api.post<{ user: User }>("/kyc/submit", { fullName, country });
      setUser(data.user);
      setSuccess('KYC submitted successfully');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Failed to submit KYC");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-2"><Alert title="KYC error" onClose={() => setError(null)}>{error}</Alert></div>
      )}
      {success && (
        <div className="mb-2"><Alert variant="success" title="Success" onClose={() => setSuccess(null)}>{success}</Alert></div>
      )}
      <h1 className="text-2xl font-semibold">KYC</h1>
      <p className="mt-1">Status: <strong>{user?.kycStatus ?? "UNKNOWN"}</strong></p>
      {user?.kycStatus !== "PENDING" && user?.kycStatus !== "VERIFIED" && (
        <form onSubmit={onSubmit} className="mt-4 max-w-md space-y-3">
          <div>
            <label className="block text-sm text-gray-700">Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Country</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading} className="rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-70">
            {loading ? "Submitting..." : "Submit KYC"}
          </button>
        </form>
      )}
    </div>
  );
}


