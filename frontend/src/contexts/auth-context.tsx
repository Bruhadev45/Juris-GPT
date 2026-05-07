"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_STORAGE_KEY = "jurisgpt.access_token";

// Marker cookie read by `src/middleware.ts` to gate /dashboard/* etc. The
// cookie holds NO secrets — the actual JWT stays in localStorage and is sent
// via Authorization header. This is purely a soft signal so the edge runtime
// (which can't read localStorage) can redirect to /login fast.
const SESSION_COOKIE_NAME = "jurisgpt_session_active";
const SESSION_COOKIE_MAX_AGE = 60 * 60; // 1 hour, matches JWT lifetime

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  company_name: string | null;
  phone: string | null;
  role: string;
  is_verified: boolean;
  created_at: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
  company_name?: string;
  phone?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  status: "loading" | "authenticated" | "anonymous";
  login(email: string, password: string): Promise<AuthUser>;
  signup(input: SignupRequest): Promise<AuthUser>;
  logout(): void;
  refresh(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeToken(value: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Storage can be disabled (private mode, quotas) — fall through.
  }
  syncSessionCookie(value !== null);
}

function syncSessionCookie(active: boolean): void {
  if (typeof document === "undefined") return;
  const secureFlag = window.location.protocol === "https:" ? "; secure" : "";
  if (active) {
    document.cookie = `${SESSION_COOKIE_NAME}=1; path=/; max-age=${SESSION_COOKIE_MAX_AGE}; samesite=lax${secureFlag}`;
  } else {
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; samesite=lax${secureFlag}`;
  }
}

async function readJsonError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string; message?: string };
    return body.detail || body.message || response.statusText || "Request failed";
  } catch {
    return response.statusText || "Request failed";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  // Track whether we've finished the initial /me probe so we don't flip
  // status to anonymous before the request returns.
  const bootstrapped = useRef(false);

  const fetchMe = useCallback(async (accessToken: string): Promise<AuthUser | null> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return null;
      return (await response.json()) as AuthUser;
    } catch {
      return null;
    }
  }, []);

  // On mount: if we have a stored token, verify it via /me.
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const stored = readToken();
    if (!stored) {
      setStatus("anonymous");
      return;
    }

    setToken(stored);
    // Cookie may have expired even if localStorage still has a token; refresh it.
    syncSessionCookie(true);
    fetchMe(stored).then((me) => {
      if (me) {
        setUser(me);
        setStatus("authenticated");
      } else {
        // Token rejected — clear it so the user gets a clean re-login.
        writeToken(null);
        setToken(null);
        setStatus("anonymous");
      }
    });
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      throw new Error(await readJsonError(response));
    }
    const payload = (await response.json()) as TokenResponse;
    writeToken(payload.access_token);
    setToken(payload.access_token);
    setUser(payload.user);
    setStatus("authenticated");
    return payload.user;
  }, []);

  const signup = useCallback(async (input: SignupRequest): Promise<AuthUser> => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new Error(await readJsonError(response));
    }
    const payload = (await response.json()) as TokenResponse;
    writeToken(payload.access_token);
    setToken(payload.access_token);
    setUser(payload.user);
    setStatus("authenticated");
    return payload.user;
  }, []);

  const logout = useCallback(() => {
    // Best-effort: tell the backend we're done. We don't await — server-side
    // logout is informational only since JWTs are stateless.
    const stored = readToken();
    if (stored) {
      fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${stored}` },
      }).catch(() => {
        // Network error is fine; we're clearing local state regardless.
      });
    }
    writeToken(null);
    setToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  const refresh = useCallback(async () => {
    const stored = readToken();
    if (!stored) {
      setStatus("anonymous");
      return;
    }
    const me = await fetchMe(stored);
    if (me) {
      setUser(me);
      setStatus("authenticated");
    } else {
      writeToken(null);
      setToken(null);
      setUser(null);
      setStatus("anonymous");
    }
  }, [fetchMe]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, status, login, signup, logout, refresh }),
    [user, token, status, login, signup, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be called inside <AuthProvider>");
  return ctx;
}

/** Read the current token outside React (for api.ts and similar utilities). */
export function getAccessToken(): string | null {
  return readToken();
}
