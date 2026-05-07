"use client";

/**
 * Auth context — thin adapter over Clerk so the rest of the app keeps using
 * a single `useAuth()` interface.
 *
 * What changed: when the project moved to Clerk we kept this module instead
 * of deleting it so dashboard/sidebar callers like `useAuth().logout()` and
 * `useAuth().user.full_name` keep working without per-component edits.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useUser as useClerkUser,
  useAuth as useClerkAuth,
  useClerk,
} from "@clerk/nextjs";

const TOKEN_STORAGE_KEY = "jurisgpt.access_token";
const SESSION_COOKIE_NAME = "jurisgpt_session_active";
const SESSION_COOKIE_MAX_AGE = 60 * 60;

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

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  status: "loading" | "authenticated" | "anonymous";
  logout(): void;
  refresh(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function syncSessionCookie(active: boolean): void {
  if (typeof document === "undefined") return;
  const secureFlag = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${SESSION_COOKIE_NAME}=${active ? "1" : ""}; path=/; max-age=${active ? SESSION_COOKIE_MAX_AGE : 0}; samesite=lax${secureFlag}`;
}

function writeToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage may be disabled (private mode).
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const clerk = useClerk();
  const clerkUser = useClerkUser();
  const clerkAuth = useClerkAuth();

  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const lastTokenRefresh = useRef(0);

  // Build a JurisGPT-shaped user object from Clerk's user resource.
  const user = useMemo<AuthUser | null>(() => {
    if (!clerkUser.isLoaded || !clerkUser.user) return null;
    const u = clerkUser.user;
    const email = u.primaryEmailAddress?.emailAddress ?? "";
    return {
      id: u.id,
      email,
      full_name:
        [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
        u.username ||
        email,
      company_name: (u.publicMetadata?.company_name as string | undefined) ?? null,
      phone: u.primaryPhoneNumber?.phoneNumber ?? null,
      role: (u.publicMetadata?.role as string | undefined) ?? "user",
      is_verified: u.primaryEmailAddress?.verification?.status === "verified",
      created_at:
        typeof u.createdAt === "string"
          ? u.createdAt
          : (u.createdAt as Date | undefined)?.toISOString?.() ?? new Date().toISOString(),
    };
  }, [clerkUser.isLoaded, clerkUser.user]);

  // Sync Clerk session token into localStorage + marker cookie so api.ts and
  // edge middleware can read auth state without depending on Clerk hooks.
  useEffect(() => {
    if (!clerkAuth.isLoaded) {
      setStatus("loading");
      return;
    }
    if (!clerkAuth.isSignedIn) {
      writeToken(null);
      syncSessionCookie(false);
      setToken(null);
      setStatus("anonymous");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // Clerk JWT is short-lived (default 1 min) but auto-refreshes on
        // getToken() — we keep a fresh copy in localStorage for api.ts.
        const fresh = await clerkAuth.getToken();
        if (cancelled) return;
        if (fresh) {
          writeToken(fresh);
          syncSessionCookie(true);
          setToken(fresh);
          setStatus("authenticated");
          lastTokenRefresh.current = Date.now();
        }
      } catch {
        // Network error — leave status as loading so UI doesn't flash signed-out.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clerkAuth.isLoaded, clerkAuth.isSignedIn, clerkAuth]);

  // Refresh the cached token every 45s while signed in so api.ts always has
  // a non-expired one.
  useEffect(() => {
    if (status !== "authenticated") return;
    const interval = window.setInterval(async () => {
      try {
        const fresh = await clerkAuth.getToken();
        if (fresh) {
          writeToken(fresh);
          syncSessionCookie(true);
          setToken(fresh);
          lastTokenRefresh.current = Date.now();
        }
      } catch {
        /* ignore — next tick retries */
      }
    }, 45_000);
    return () => window.clearInterval(interval);
  }, [status, clerkAuth]);

  const logout = useCallback(() => {
    writeToken(null);
    syncSessionCookie(false);
    setToken(null);
    setStatus("anonymous");
    clerk.signOut().catch(() => {
      /* sign-out best effort */
    });
  }, [clerk]);

  const refresh = useCallback(async () => {
    try {
      const fresh = await clerkAuth.getToken();
      if (fresh) {
        writeToken(fresh);
        syncSessionCookie(true);
        setToken(fresh);
      }
    } catch {
      /* ignore */
    }
  }, [clerkAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, status, logout, refresh }),
    [user, token, status, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be called inside <AuthProvider>");
  return ctx;
}

/** Read the current Clerk JWT outside React (api.ts, etc.). */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}
