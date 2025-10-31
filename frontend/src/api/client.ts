import axios from "axios";
import type { AxiosError, AxiosInstance } from "axios";
import type { AuthResponse, Tokens, Paginated, Transaction, ReconcileResult, User, AuditLog } from "../types";

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3001/api/v1";
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export function getStoredTokens(): Tokens | null {
	const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
	const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
	if (!accessToken || !refreshToken) return null;
	return { accessToken, refreshToken };
}

export function setStoredTokens(tokens: Tokens) {
	localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
	localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearStoredTokens() {
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
}

let refreshingPromise: Promise<string> | null = null;

function createClient(): AxiosInstance {
	const instance = axios.create({
		baseURL: BASE_URL,
		headers: { "Content-Type": "application/json" },
	});

	instance.interceptors.request.use((config) => {
		const tokens = getStoredTokens();
		if (tokens?.accessToken) {
			config.headers = config.headers ?? {};
			config.headers.Authorization = `Bearer ${tokens.accessToken}`;
		}
		return config;
	});

	instance.interceptors.response.use(
		(res) => res,
		async (error: AxiosError) => {
			const originalRequest: any = error.config;
			const status = error.response?.status;
			if (status === 401 && !originalRequest._retry) {
				const stored = getStoredTokens();
				if (!stored?.refreshToken) {
					clearStoredTokens();
					return Promise.reject(error);
				}

				originalRequest._retry = true;
				if (!refreshingPromise) {
					refreshingPromise = refreshAccessToken(stored.refreshToken)
						.then((newAccess) => {
							const tokens = getStoredTokens();
							if (tokens) setStoredTokens({ ...tokens, accessToken: newAccess });
							return newAccess;
						})
						.finally(() => {
							refreshingPromise = null;
						});
				}
				const newAccessToken = await refreshingPromise;
				originalRequest.headers = originalRequest.headers ?? {};
				originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
				return instance(originalRequest);
			}
			return Promise.reject(error);
		}
	);

	return instance;
}

export const api = createClient();

// Auth endpoints
export async function signup(email: string, password: string): Promise<AuthResponse> {
	const { data } = await api.post<AuthResponse>("/auth/signup", { email, password });
	return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
	const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
	return data;
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
	const { data } = await axios.post<{ accessToken: string }>(
		`${BASE_URL}/auth/refresh`,
		{ refreshToken },
		{ headers: { "Content-Type": "application/json" } }
	);
	return data.accessToken;
}

export async function logout(refreshToken: string): Promise<void> {
	await api.post("/auth/logout", { refreshToken });
}

export async function me(): Promise<{ user: User }> {
    const { data } = await api.get<{ user: User }>("/auth/me");
    return data;
}

// Transaction endpoints
export async function deposit(accountId: string, amountMinor: number, idempotencyKey: string, otpCode?: string): Promise<{ transaction: Transaction; balanceMinor: number }> {
    const { data } = await api.post<{ transaction: Transaction; balanceMinor: number }>(
        `/accounts/${accountId}/deposits`,
        { amount_minor: String(amountMinor), ...(otpCode ? { otp_code: otpCode } : {}) },
        { headers: { 'Idempotency-Key': idempotencyKey } }
    );
    return data;
}

export async function withdraw(accountId: string, amountMinor: number, idempotencyKey: string, otpCode?: string): Promise<{ transaction: Transaction; balanceMinor: number }> {
    const { data } = await api.post<{ transaction: Transaction; balanceMinor: number }>(
        `/accounts/${accountId}/withdrawals`,
        { amount_minor: String(amountMinor), ...(otpCode ? { otp_code: otpCode } : {}) },
        { headers: { 'Idempotency-Key': idempotencyKey } }
    );
    return data;
}

export async function listTransactions(accountId: string, page: number, pageSize: number): Promise<Paginated<Transaction>> {
    const { data } = await api.get<Paginated<Transaction>>(`/accounts/${accountId}/transactions`, { params: { page, pageSize } });
    return data;
}

export async function closeAccount(accountId: string, otpCode: string): Promise<{ account: { id: string; status: string } }> {
    const { data } = await api.delete<{ account: { id: string; status: string } }>(
        `/accounts/${accountId}`,
        { data: { otp_code: otpCode } as any }
    );
    return data;
}

export async function convert(
    accountId: string,
    toCurrency: string,
    amountMinor: number,
    idempotencyKey: string,
    rate?: number | null,
    rateTimestampIso?: string | null,
    otpCode?: string
): Promise<{ transaction: Transaction; balanceMinor: number }> {
    const payload: any = { to_currency: toCurrency, amount_minor: String(amountMinor) };
    if (rate != null && rateTimestampIso) {
        payload.rate = rate;
        payload.rate_timestamp = rateTimestampIso;
    }
    if (otpCode) payload.otp_code = otpCode;
    const { data } = await api.post<{ transaction: Transaction; balanceMinor: number }>(
        `/accounts/${accountId}/convert`,
        payload,
        { headers: { 'Idempotency-Key': idempotencyKey } }
    );
    return data;
}

// Admin reconciliation
export async function reconcileRun(): Promise<ReconcileResult> {
    const { data } = await api.post<ReconcileResult>(`/admin/reconcile/run`, {});
    return data;
}

export async function reconcileStatus(): Promise<ReconcileResult> {
    const { data } = await api.get<ReconcileResult>(`/admin/reconcile/status`);
    return data;
}

// Admin users
export async function listUsers(page: number, pageSize: number, search?: string): Promise<Paginated<User>> {
    const { data } = await api.get<Paginated<User>>(`/admin/users`, { params: { page, pageSize, search } });
    return data;
}

export async function getUserDetail(userId: string): Promise<{ user: User }> {
    const { data } = await api.get<{ user: User }>(`/admin/users/${userId}`);
    return data;
}

export async function listAudit(params: { actorId?: string; action?: string; from?: string; to?: string; page: number; pageSize: number }): Promise<Paginated<AuditLog>> {
    const { data } = await api.get<Paginated<AuditLog>>(`/admin/audit`, { params });
    return data;
}

export async function resetUserTotp(userId: string): Promise<{ success: true }> {
    const { data } = await api.post<{ success: true }>(`/admin/users/${userId}/totp/reset`, {});
    return data;
}

// MFA (TOTP)
export async function totpSetup(): Promise<{ qrcodeDataUrl: string; label: string; secret: string }> {
    const { data } = await api.post<{ qrcodeDataUrl: string; label: string; secret: string }>(`/mfa/totp/setup`, {});
    return data;
}

export async function totpEnable(otpCode: string): Promise<{ success: true }> {
    const { data } = await api.post<{ success: true }>(`/mfa/totp/enable`, { otp_code: otpCode });
    return data;
}


