import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  subtitle: string;
  redirectPath: string;
  notice?: string | null;
};

/** Shared passwordless login (magic link) used by /chat and /admin. */
export function MagicLinkLogin({ title, subtitle, redirectPath, notice }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: `${window.location.origin}${redirectPath}` },
    });
    setBusy(false);
    if (err) setError(err.message);
    else setSent(true);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-10">
      <div className="surface-panel p-6">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        {notice && <p className="mt-3 text-sm text-destructive">{notice}</p>}

        {!sent ? (
          <form onSubmit={send} className="mt-6 space-y-3">
            <Input
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Button type="submit" className="w-full rounded-full" disabled={busy}>
              {busy ? "Sending..." : "Send access link"}
            </Button>
          </form>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-foreground">
              We sent an email to <strong>{email}</strong>. Open the message and click the{" "}
              <strong>“Log In”</strong> button to enter — you can leave this tab open.
            </p>
            <button
              type="button"
              className="w-full text-xs text-muted-foreground underline"
              onClick={() => {
                setSent(false);
                setError(null);
              }}
            >
              Use another email
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
