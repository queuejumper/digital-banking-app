export type Role = "ACCOUNT_HOLDER" | "STAFF" | "ADMIN";

export type KycStatus = "PENDING" | "VERIFIED" | "REJECTED" | "UNVERIFIED";

export interface User {
	id: string;
	email: string;
	role: Role;
	kycStatus: KycStatus;
	mfaEnabled?: boolean;
	totpEnabled?: boolean;
}

export interface Tokens {
	accessToken: string;
	refreshToken: string;
}

export interface AuthResponse {
	user: User;
	tokens: Tokens;
}

export interface Account {
	id: string;
	userId: string;
	currency: string;
	status: "OPEN" | "CLOSED";
	balanceMinor: number;
	createdAt: string;
}

export type TransactionType = "DEPOSIT" | "WITHDRAWAL";

export interface Transaction {
	id: string;
	type: TransactionType;
	amountMinor: number;
	currency: string;
	createdAt: string;
}

export interface Paginated<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
}

export interface ReconcileMismatch {
	accountId: string;
	currency: string;
	balanceMinor: number | string;
	computedMinor: number | string;
	deltaMinor: number | string;
}

export interface ReconcileResult {
	mismatches: ReconcileMismatch[];
	checked: number;
}

export interface AuditLog {
	id: string;
	createdAt: string;
	actorId: string;
	action: string;
	resource: string;
	metadata: unknown;
}

export interface ApiErrorEnvelope {
	error: {
		code: string;
		message: string;
	};
}

export type ApiResult<T> = T | never;


