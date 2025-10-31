import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, deposit as depositApi, withdraw as withdrawApi, listTransactions, convert as convertApi, closeAccount as closeAccountApi } from "../api/client";
import type { Account, Transaction } from "../types";
import Alert from "../components/Alert";
import { useAuth } from "../auth/AuthContext";

export default function AccountDetail() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [confirmAction, setConfirmAction] = useState<
    | null
    | { kind: 'DEPOSIT' | 'WITHDRAW'; amount: number; otp?: string }
    | { kind: 'CONVERT'; amount: number; to: string; rate: number | null; rateTs: string | null; otp?: string }
    | { kind: 'CLOSE'; amount: number; to: string; rate: null; rateTs: null; otp?: string }
  >(null);
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(10);
  const [txItems, setTxItems] = useState<Transaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [convertCurrency, setConvertCurrency] = useState<string>("");
  const [convertAmount, setConvertAmount] = useState<string>("0");
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [rateTs, setRateTs] = useState<string | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  async function load() {
    try {
      const { data } = await api.get<{ account: Account }>(`/accounts/${accountId}`);
      setAccount(data.account);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Failed to load account");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadTx(1, txPageSize);
    // load available destination currencies (other accounts of same user)
    (async () => {
      try {
        const { data } = await api.get<{ accounts: Account[] }>(`/accounts`);
        const currencies = Array.from(new Set((data.accounts || []).filter(a => a.status === 'OPEN').map(a => a.currency)));
        setAvailableCurrencies(currencies);
      } catch {}
    })();
    (async () => {
      try {
        const { data } = await api.get<{ user: { id: string; email: string; kycStatus: string } }>(`/kyc/status`);
        setKycStatus(data.user.kycStatus);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  // Debounced indicative FX rate fetch (ECB via frankfurter.app)
  useEffect(() => {
    if (!account || !convertCurrency || convertCurrency === account.currency) { setRate(null); setRateTs(null); return; }
    if (!/^\d+$/.test(convertAmount) || convertAmount === '0') { setRate(null); setRateTs(null); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setRateLoading(true); setRateError(null);
        const res = await fetch(`https://api.frankfurter.app/latest?from=${account.currency}&to=${convertCurrency}`);
        const data = await res.json();
        if (!cancelled) {
          const r = data?.rates?.[convertCurrency];
          if (typeof r === 'number') { setRate(r); setRateTs(data?.date ? new Date(data.date).toISOString() : new Date().toISOString()); }
          else { setRate(null); setRateTs(null); setRateError('Rate not available'); }
        }
      } catch (e: any) {
        if (!cancelled) { setRate(null); setRateTs(null); setRateError('Rate fetch failed'); }
      } finally { if (!cancelled) setRateLoading(false); }
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [account, convertCurrency, convertAmount]);

  async function loadTx(page: number, pageSize: number) {
    if (!accountId) return;
    try {
      const data = await listTransactions(accountId, page, pageSize);
      setTxItems(data.items);
      setTxTotal(data.total);
      setTxPage(data.page);
      setTxPageSize(data.pageSize);
    } catch (err: any) {
      // ignore list errors for now
    }
  }

  async function onClose() {
    if (!account) return;
    setError(null);
    setConfirmAction({ kind: 'CLOSE', amount: 0, to: account.currency, rate: null, rateTs: null });
  }

  function makeKey() {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  }

  async function onDeposit(e: FormEvent) {
    e.preventDefault();
    if (!account) return;
    if (Number(depositAmount) <= 0) {
      return;
    }
    setError(null);
    setConfirmAction({ kind: 'DEPOSIT', amount: Number(depositAmount) });
  }

  async function onWithdraw(e: FormEvent) {
    e.preventDefault();
    if (!account) return;
    if (Number(withdrawAmount) <= 0) {
      return;
    }
    if (Number(withdrawAmount) > numericBalance) {
      setError('Withdrawal amount exceeds available balance');
      return;
    }
    setError(null);
    setConfirmAction({ kind: 'WITHDRAW', amount: Number(withdrawAmount) });
  }

  async function confirmPendingAction() {
    if (!account || !confirmAction) return;
    try {
      if (confirmAction.kind === 'DEPOSIT') {
        const res = await depositApi(account.id, confirmAction.amount, makeKey(), (confirmAction as any).otp);
        setAccount({ ...account, balanceMinor: res.balanceMinor });
        setSuccess('Deposit completed successfully');
      } else if (confirmAction.kind === 'WITHDRAW') {
        const res = await withdrawApi(account.id, confirmAction.amount, makeKey(), (confirmAction as any).otp);
        setAccount({ ...account, balanceMinor: res.balanceMinor });
        setSuccess('Withdrawal completed successfully');
      } else if (confirmAction.kind === 'CONVERT') {
        const res = await convertApi(account.id, confirmAction.to, confirmAction.amount, makeKey(), confirmAction.rate ?? null, confirmAction.rateTs ?? null, (confirmAction as any).otp);
        setAccount({ ...account, balanceMinor: res.balanceMinor });
        setSuccess('Conversion completed successfully');
      } else {
        const res = await closeAccountApi(account.id, (confirmAction as any).otp || "");
        setAccount({ ...account, status: (res.account as any).status });
        setSuccess('Account closed successfully');
      }
      await loadTx(1, txPageSize);
      setDepositAmount(0);
      setWithdrawAmount(0);
      setConfirmAction(null);
      setError(null);
    } catch (err: any) {
      const code = err?.response?.data?.error?.code
      if (code === 'OTP_SETUP_REQUIRED') navigate('/security')
      else if (code === 'OTP_REQUIRED') setError('Enter your authenticator code')
      else if (code === 'OTP_INVALID') setError('Invalid code. Try again.')
      else setError(err?.response?.data?.error?.message || 'Action failed');
      setSuccess(null);
    }
  }

  async function onConvert(e: FormEvent) {
    e.preventDefault();
    if (!account || !convertCurrency || convertCurrency === account.currency) return;
    if (!/^\d+$/.test(convertAmount) || convertAmount === "0") return;
    setError(null);
    setConfirmAction({ kind: 'CONVERT', amount: Number(convertAmount), to: convertCurrency, rate, rateTs });
  }

  if (loading) return <p className="text-gray-600">Loading...</p>;
  if (!account) return <p className="text-gray-600">Not found</p>;

  const numericBalance = Number(account.balanceMinor)
  const canClose = numericBalance === 0 && account.status !== "CLOSED";

  return (
    <div>
      {error && (
        <div className="mb-2">
          <Alert title="Action failed" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}
      {success && (
        <div className="mb-2">
          <Alert variant="success" title="Success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </div>
      )}
      <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">&larr; Back</button>
      <h1 className="text-2xl font-semibold mt-2">Account {account.id}</h1>
      <div className="mt-3 grid gap-1">
        <p><span className="text-gray-600">Currency:</span> {account.currency}</p>
        <p><span className="text-gray-600">Status:</span> {account.status}</p>
        <p><span className="text-gray-600">Balance:</span> {numericBalance}</p>
      </div>
      <button onClick={onClose} disabled={!canClose || closing} className="mt-3 rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100 disabled:opacity-70">
        {closing ? "Closing..." : "Close account"}
      </button>
      {!canClose && <p className="text-sm text-gray-600 mt-1">Close is disabled unless balance is zero.</p>}

      <h2 className="text-xl font-semibold mt-6">Transactions</h2>
      {convertCurrency && convertCurrency !== account.currency && /^\d+$/.test(convertAmount) && convertAmount !== '0' && (
        <div className="text-sm text-slate-600 mb-2">
          {rateLoading ? 'Fetching indicative rate…' : rateError ? `Rate error: ${rateError}` : rate != null ? `Indicative: ~${Math.floor(Number(convertAmount) * rate)} ${convertCurrency} (rate ${rate.toFixed(6)} as of ${rateTs ? new Date(rateTs).toLocaleString() : 'now'})` : 'Select a currency to see rate'}
        </div>
      )}
      {confirmAction && (
        <div className="my-3 rounded-lg border bg-white p-3 shadow-sm">
          <div className="font-medium mb-1">Confirm {confirmAction.kind === 'DEPOSIT' ? 'deposit' : confirmAction.kind === 'WITHDRAW' ? 'withdrawal' : confirmAction.kind === 'CONVERT' ? 'conversion' : 'close account'}</div>
          <div className="text-sm text-slate-700 grid gap-1">
            <div>Account: <span className="font-mono">#{account.id}</span></div>
            <div>Currency: {account.currency}</div>
            <div>Current balance: {numericBalance}</div>
            <div>Amount (minor): {confirmAction.amount}</div>
            {confirmAction.kind === 'CONVERT' ? (
              <>
                <div>To currency: {confirmAction.to}</div>
                <div>Indicative rate: {confirmAction.rate != null ? confirmAction.rate.toFixed(6) : '—'}</div>
                <div>As of: {confirmAction.rateTs ? new Date(confirmAction.rateTs).toLocaleString() : '—'}</div>
                <div>Estimated received (minor): {confirmAction.rate != null ? Math.floor(confirmAction.amount * confirmAction.rate) : '—'}</div>
                <div>Resulting source balance: {numericBalance - confirmAction.amount}</div>
              </>
            ) : confirmAction.kind === 'CLOSE' ? (
              <div>Result: account will be closed.</div>
            ) : (
              <div>Resulting balance: {confirmAction.kind === 'DEPOSIT' ? numericBalance + confirmAction.amount : numericBalance - confirmAction.amount}</div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-sm text-gray-700">OTP (required)</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="mt-1 w-40 rounded-md border border-gray-300 px-3 py-2 font-mono text-center tracking-widest"
                value={(confirmAction as any).otp || ''}
                onChange={(e) => {
                  const digits = (e.target.value || '').replace(/\D/g, '').slice(0, 6)
                  setConfirmAction(prev => prev ? ({ ...prev as any, otp: digits }) : prev)
                }}
                placeholder="••• •••"
                aria-label="One-time password"
              />
            </div>
            <button onClick={confirmPendingAction} disabled={!((confirmAction as any).otp && (confirmAction as any).otp.length >= 6)} className="rounded-md bg-emerald-600 text-white px-3 py-2 hover:bg-emerald-700 disabled:opacity-50">Confirm</button>
            <button onClick={() => setConfirmAction(null)} className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-100">Cancel</button>
          </div>
          {user && user.mfaEnabled === false && (
            <div className="text-sm text-amber-700 bg-amber-50 rounded px-2 py-1 mt-2">Two-factor is required for transactions. Please enable it in Security.</div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 my-2">
        <form onSubmit={onDeposit} className="flex items-end gap-2">
          <div>
            <label className="block text-sm text-gray-700">Deposit amount (minor)</label>
            <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(parseInt(e.target.value || '0', 10))} min={0} className="mt-1 w-40 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={Number(depositAmount) <= 0} className="rounded-md bg-blue-600 text-white px-3 py-2 hover:bg-blue-700 disabled:opacity-50">Deposit</button>
        </form>
        <form onSubmit={onWithdraw} className="flex items-end gap-2">
          <div>
            <label className="block text-sm text-gray-700">Withdraw amount (minor)</label>
            <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(parseInt(e.target.value || '0', 10))} min={0} className="mt-1 w-44 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={Number(withdrawAmount) <= 0 || Number(withdrawAmount) > numericBalance} className="rounded-md bg-gray-900 text-white px-3 py-2 hover:bg-black disabled:opacity-50">Withdraw</button>
        </form>
        <form onSubmit={onConvert} className="flex items-end gap-2">
          <div>
            <label className="block text-sm text-gray-700">Convert to</label>
            <select value={convertCurrency} onChange={(e) => setConvertCurrency(e.target.value)} className="mt-1 w-40 rounded-md border border-gray-300 px-3 py-2">
              <option value="">Select</option>
              {availableCurrencies.filter(c => !account || c !== account.currency).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700">Amount (minor)</label>
            <input type="text" value={convertAmount} onChange={(e) => setConvertAmount((/^[0-9]*$/.test(e.target.value) ? e.target.value : convertAmount))} className="mt-1 w-44 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={kycStatus !== 'VERIFIED' || !convertCurrency || convertCurrency === account.currency || !/^\d+$/.test(convertAmount) || convertAmount === '0'} className="rounded-md bg-blue-600 text-white px-3 py-2 hover:bg-blue-700 disabled:opacity-50">Review</button>
        </form>
        {!availableCurrencies.filter(c => !account || c !== account.currency).length && (
          <div className="text-sm text-slate-600">No destination account. <button className="underline" onClick={async () => { if (!account) return; const cur = prompt('Create account in which currency?'); if (!cur) return; try { await api.post('/accounts', { currency: cur }); const { data } = await api.get<{ accounts: Account[] }>(`/accounts`); const currencies = Array.from(new Set((data.accounts || []).filter(a => a.status === 'OPEN').map(a => a.currency))); setAvailableCurrencies(currencies); } catch (err: any) { setError(err?.response?.data?.error?.message || 'Failed to create account'); } }}>Create account</button></div>
        )}
        {kycStatus && kycStatus !== 'VERIFIED' && (
          <div className="text-sm text-amber-700 bg-amber-50 rounded px-2 py-1">KYC required to convert. Please complete verification in the KYC page.</div>
        )}
      </div>

      <ul className="grid gap-2">
        {txItems.map(tx => (
          <li key={tx.id} className="border rounded-lg bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div><span className="font-medium">{tx.type}</span> {tx.amountMinor} {account.currency}</div>
              <div className="text-sm text-gray-600">{new Date(tx.createdAt).toLocaleString()}</div>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 mt-2">
        <button disabled={txPage <= 1} onClick={() => loadTx(txPage - 1, txPageSize)} className="px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50">&larr; Prev</button>
        <span className="text-sm">Page {txPage}</span>
        <button disabled={txPage * txPageSize >= txTotal} onClick={() => loadTx(txPage + 1, txPageSize)} className="px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50">Next &rarr;</button>
      </div>
    </div>
  );
}


