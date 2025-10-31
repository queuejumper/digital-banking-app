import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { totpSetup, totpEnable, me } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import Alert from "../components/Alert";

export default function SecurityPage() {
  const { refreshUserFromServer } = useAuth();
  const navigate = useNavigate();
  const [qr, setQr] = useState<string>("");
  const [label, setLabel] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [otpauthUrl, setOtpauthUrl] = useState<string>("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { user } = await me();
        setEnabled(!!(user as any).totpEnabled || !!(user as any).mfaEnabled);
      } catch {}
    })();
  }, []);

  async function startSetup() {
    setError(null); setMessage(null);
    if (enabled) {
      setError('2FA is already enabled. Please contact an administrator to reset it if needed.');
      return;
    }
    try {
      const { qrcodeDataUrl, label, secret, otpauth_url } = await totpSetup() as any;
      setQr(qrcodeDataUrl); setLabel(label || ""); setSecret(secret || ""); setOtpauthUrl(otpauth_url || "");
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to start setup');
    }
  }

  async function onEnable(e: FormEvent) {
    e.preventDefault(); setError(null); setMessage(null); setLoading(true);
    try {
      await totpEnable(otp);
      setMessage('2FA enabled');
      setQr(""); setLabel(""); setSecret(""); setOtp("");
      await refreshUserFromServer();
      setEnabled(true);
      navigate('/accounts', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to enable');
    } finally { setLoading(false); }
  }

  return (
    <div>
      {error && <div className="mb-2"><Alert title="Error" onClose={() => setError(null)}>{error}</Alert></div>}
      {message && <div className="mb-2"><Alert variant="success" title="Success" onClose={() => setMessage(null)}>{message}</Alert></div>}
      <h1 className="text-2xl font-semibold">Security</h1>
      <p className="text-sm text-slate-600">Enable two-factor authentication (TOTP).</p>
      <div className="mt-3">
        {enabled && !qr && (
          <div className="mb-3"><Alert variant="info" title="2FA already enabled">Two-factor authentication is active on your account. To reconfigure, ask an administrator to reset your 2FA.</Alert></div>
        )}
        {!qr ? (
          <button onClick={startSetup} disabled={!!enabled} className="rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-50">Set up TOTP</button>
        ) : (
          <div className="grid gap-3 md:flex md:items-start md:gap-6">
            <img src={qr} alt="TOTP QR" className="border rounded" />
            <div className="max-w-sm">
              <p className="text-sm text-slate-700">Scan this QR with an authenticator app (Google Authenticator, Authy, 1Password) on your phone or browser. If you can’t scan, enter the secret manually.</p>
              {label && <div className="text-sm">Label: {label}</div>}
              {secret && <div className="text-sm">Secret (manual): <span className="font-mono">{secret}</span></div>}
              {otpauthUrl && <div className="text-xs break-all text-slate-500">otpauth: {otpauthUrl}</div>}
              <form onSubmit={onEnable} className="mt-3 space-y-2">
                <div>
                  <label className="block text-sm text-gray-700">Current code</label>
                  <input
                    type="password"
                    value={otp}
                    onChange={(e) => setOtp((e.target.value || '').replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-center tracking-widest"
                    placeholder="••• •••"
                    aria-label="One-time password"
                  />
                </div>
                <button disabled={loading || otp.length < 6} className="rounded-md bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 disabled:opacity-70">Enable 2FA</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


