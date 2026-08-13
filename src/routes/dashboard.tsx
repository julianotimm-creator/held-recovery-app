import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-session";
import { useSubscription } from "@/hooks/use-subscription";
import { EmailGate } from "@/components/EmailGate";
import { supabase } from "@/integrations/supabase/client";
import { clearStoredSession } from "@/lib/session-store";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { confirmCheckoutSession } from "@/lib/checkout.functions";
import { useEffect, useRef } from "react";

export type DashboardSearch = { checkout?: "success" | "cancelled"; session_id?: string };

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): DashboardSearch => {
    const out: DashboardSearch = {};
    if (search["checkout"] === "success" || search["checkout"] === "cancelled") {
      out.checkout = search["checkout"];
    }
    if (typeof search["session_id"] === "string") out.session_id = search["session_id"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "Sua conta — HELD" },
      { name: "description", content: "Sua área de membro HELD: comunidade, chat e conta." },
      { property: "og:title", content: "Sua conta — HELD" },
      { property: "og:description", content: "Área de membro do HELD." },
      { property: "og:url", content: "https://www.always-beside.com/dashboard" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.always-beside.com/dashboard" }],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { session, loading } = useSession();
  const search = useSearch({ from: "/dashboard" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const justPaid = search.checkout === "success";
  const { data: state } = useSubscription(justPaid, !!session);
  const confirmCheckout = useServerFn(confirmCheckoutSession);
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (!session || !justPaid || !search.session_id || confirmedRef.current) return;
    confirmedRef.current = true;
    confirmCheckout({ data: { sessionId: search.session_id } })
      .then((result) => {
        if (result.isPaid) queryClient.invalidateQueries({ queryKey: ["chat-state"] });
      })
      .catch(() => {
        confirmedRef.current = false;
      });
  }, [session, justPaid, search.session_id, confirmCheckout, queryClient]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    clearStoredSession();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!session) return <EmailGate />;

  const confirming = justPaid && state?.isPaid !== true;


  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="surface-panel p-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          {confirming ? "Confirmando seu pagamento..." : "Você é membro pago!"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {confirming
            ? "Isso leva alguns segundos. Vamos liberar seu acesso automaticamente."
            : "Mensagens ilimitadas com o HELD, sempre anônimas."}
        </p>

        <div className="mt-6 space-y-3">
          <Link
            to="/chat"
            search={{ tab: "community" }}
            className="block w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            Entrar na Comunidade HELD
          </Link>
          <Link
            to="/chat"
            className="block w-full rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground"
          >
            Ir para o chat
          </Link>
          <button
            onClick={signOut}
            className="w-full px-5 py-2 text-sm text-muted-foreground underline"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
