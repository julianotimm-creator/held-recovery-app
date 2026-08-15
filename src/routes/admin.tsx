import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { MagicLinkLogin } from "@/components/MagicLinkLogin";

import { getAbandonedUsers, getAdminOverview, getPayingSubscribers } from "@/lib/admin.functions";
import type { AdminRow } from "@/lib/admin-core.server";

const PAGE_SIZE = 20;

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "HELD Admin — Painel interno" },
      {
        name: "description",
        content:
          "Painel administrativo do HELD: métricas, assinantes e usuários que não converteram.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "HELD Admin" },
      { property: "og:description", content: "Painel administrativo interno do HELD." },
      { property: "og:url", content: "https://www.always-beside.com/admin" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.always-beside.com/admin" }],
  }),
  component: AdminPage,
});

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "hoje";
  if (days === 1) return "1 dia atrás";
  if (days < 30) return `${days} dias atrás`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 mês atrás";
  if (months < 12) return `${months} meses atrás`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 ano atrás" : `${years} anos atrás`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function AdminPage() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!session) return <AdminLogin />;
  return <AdminDashboard email={session.user.email ?? ""} />;
}

function AdminLogin({ expired = false }: { expired?: boolean }) {
  return (
    <MagicLinkLogin
      title="HELD Admin"
      subtitle="Acesso restrito. Enviamos um link de acesso para o seu e-mail."
      redirectPath="/admin"
      notice={expired ? "Sessão expirada, entre novamente." : null}
    />
  );
}

function AdminDashboard({ email }: { email: string }) {
  const queryClient = useQueryClient();
  const overviewFn = useServerFn(getAdminOverview);
  const abandonedFn = useServerFn(getAbandonedUsers);
  const payingFn = useServerFn(getPayingSubscribers);

  const [abandonedPage, setAbandonedPage] = useState(1);
  const [payingPage, setPayingPage] = useState(1);

  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => overviewFn(),
    retry: false,
  });
  const abandoned = useQuery({
    queryKey: ["admin-abandoned", abandonedPage],
    queryFn: () => abandonedFn({ data: { page: abandonedPage } }),
    retry: false,
  });
  const paying = useQuery({
    queryKey: ["admin-paying", payingPage],
    queryFn: () => payingFn({ data: { page: payingPage } }),
    retry: false,
  });

  async function logout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  }

  const denied = [overview.error, abandoned.error, paying.error].some((e) =>
    e ? String((e as Error).message).includes("NOT_ADMIN") : false,
  );
  const expired = [overview.error, abandoned.error, paying.error].some((e) =>
    e ? String((e as Error).message).includes("Unauthorized") : false,
  );

  if (expired) return <AdminLogin expired />;

  if (denied) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-4 px-5 text-center">
        <p className="text-2xl font-semibold text-destructive">❌ Acesso Negado</p>
        <p className="text-sm text-muted-foreground">
          Esta conta não tem permissão de administrador.
        </p>
        <Button variant="destructive" className="rounded-full" onClick={logout}>
          Sair
        </Button>
      </div>
    );
  }

  if (overview.isLoading && !overview.data) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Verificando acesso...
      </div>
    );
  }

  const m = overview.data;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">HELD Admin</h1>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <Button variant="destructive" className="rounded-full" onClick={logout}>
          Sair
        </Button>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Total de usuários" value={m ? String(m.totalUsers) : "—"} />
        <MetricCard
          label="MRR"
          value={m ? m.mrr.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
        />
        <MetricCard label="Churn rate" value={m ? `${m.churnRate.toFixed(1)}%` : "—"} />
        <MetricCard label="Ativos hoje" value={m ? String(m.activeToday) : "—"} />
      </section>

      <section className="mt-8">
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5">
          <p className="text-sm font-medium text-destructive">Testaram mas NÃO compraram</p>
          <p className="mt-1 text-4xl font-semibold text-destructive">
            {abandoned.data?.total ?? "—"}
          </p>
        </div>

        <DataTable
          headers={["E-mail", "Mensagens usadas", "Criado", "Ação"]}
          empty={abandoned.isLoading ? "Carregando..." : "Ninguém por aqui."}
          rows={(abandoned.data?.rows ?? []).map((r: AdminRow) => [
            r.email,
            String(r.messageCount),
            timeAgo(r.createdAt),
            <Button key="a" size="sm" variant="outline" className="rounded-full text-xs">
              Enviar email follow-up
            </Button>,
          ])}
        />
        <Pagination
          page={abandonedPage}
          total={abandoned.data?.total ?? 0}
          onChange={setAbandonedPage}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Assinantes pagantes</h2>
        <DataTable
          headers={["E-mail", "Status", "Data do pagamento"]}
          empty={paying.isLoading ? "Carregando..." : "Nenhum assinante ainda."}
          rows={(paying.data?.rows ?? []).map((r: AdminRow) => [
            r.email,
            "✅ Pago",
            formatDate(r.paidAt),
          ])}
        />
        <Pagination page={payingPage} total={paying.data?.total ?? 0} onChange={setPayingPage} />
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground lg:text-3xl">{value}</p>
    </div>
  );
}

function DataTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-4 py-6 text-muted-foreground">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((cells, i) => (
            <tr key={i} className={i % 2 ? "bg-secondary/40" : undefined}>
              {cells.map((c, j) => (
                <td key={j} className="px-4 py-3 text-foreground">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
      <span>
        Página {page} de {pages}
      </span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Anterior
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
