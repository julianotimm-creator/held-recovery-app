import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearStoredSession, readStoredSession, saveStoredSession } from "@/lib/session-store";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      if (event === "SIGNED_OUT") {
        clearStoredSession();
        setSession(null);
        setLoading(false);
        return;
      }

      // INITIAL_SESSION can briefly be null while a persisted session or a
      // magic-link callback is still being restored. Never erase the backup
      // in that transient state.
      if (next) {
        saveStoredSession(next);
        setSession(next);
        setLoading(false);
      }
    });

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (!error && data.session) {
        saveStoredSession(data.session);
        setSession(data.session);
        setLoading(false);
        return;
      }

      // No live session: try restoring from our own localStorage backup.
      const stored = readStoredSession();
      if (stored) {
        const { data: restored, error } = await supabase.auth.setSession({
          access_token: stored.access_token,
          refresh_token: stored.refresh_token,
        });
        if (!active) return;
        if (!error && restored.session) {
          const { data: verified, error: verifyError } = await supabase.auth.getUser();
          if (!active) return;
          if (!verifyError && verified.user) {
            saveStoredSession(restored.session);
            setSession(restored.session);
            setLoading(false);
            return;
          }
        }
        clearStoredSession();
      }

      setSession(null);
      setLoading(false);
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
