import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { login as apiLogin, signup as apiSignup, setStoredTokens, clearStoredTokens, getStoredTokens, logout as apiLogout, me as apiMe } from "../api/client";
import type { AuthResponse, Tokens, User } from "../types";

type AuthState = {
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (auth: AuthResponse) => void;
  refreshUserFromServer: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);

  useEffect(() => {
    const stored = getStoredTokens();
    if (stored) {
      setTokens(stored);
      apiMe().then(({ user }) => setUser(user)).catch(() => {}).finally(() => setIsBootstrapping(false));
    } else {
      setIsBootstrapping(false);
    }
  }, []);

  const setAuth = useCallback((auth: AuthResponse) => {
    setUser(auth.user);
    setTokens(auth.tokens);
    setStoredTokens(auth.tokens);
  }, []);

  const refreshUserFromServer = useCallback(async () => {
    try {
      const { user } = await apiMe();
      setUser(user);
    } catch {}
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const auth = await apiLogin(email, password);
    setAuth(auth);
  }, [setAuth]);

  const signup = useCallback(async (email: string, password: string) => {
    const auth = await apiSignup(email, password);
    setAuth(auth);
  }, [setAuth]);

  const logout = useCallback(async () => {
    const stored = getStoredTokens();
    try {
      if (stored?.refreshToken) {
        await apiLogout(stored.refreshToken);
      }
    } finally {
      clearStoredTokens();
      setUser(null);
      setTokens(null);
    }
  }, []);

  const value = useMemo<AuthState>(() => ({
    user,
    tokens,
    isAuthenticated: !!tokens,
    isBootstrapping,
    login,
    signup,
    logout,
    setAuth,
    refreshUserFromServer,
  }), [user, tokens, isBootstrapping, login, signup, logout, setAuth, refreshUserFromServer]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


