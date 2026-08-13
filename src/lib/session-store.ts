import type { Session } from "@supabase/supabase-js";

/**
 * Backup of the Supabase session tokens kept in localStorage.
 *
 * The generated Supabase client already persists sessions, but if the client
 * is ever instantiated without access to `localStorage` (SSR/hydration edge
 * cases, blocked storage on first paint) the session only lives in memory and
 * is lost on every reload. Keeping our own copy lets us restore it explicitly.
 */
const STORAGE_KEY = "held.auth.session";

type StoredSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number | undefined;
};

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: Session | null): void {
  const store = storage();
  if (!store) return;
  try {
    if (!session?.access_token || !session?.refresh_token) {
      store.removeItem(STORAGE_KEY);
      return;
    }
    const payload: StoredSession = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
    };
    store.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function readStoredSession(): StoredSession | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.access_token || !parsed?.refresh_token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredSession(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
