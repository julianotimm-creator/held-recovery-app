import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { MagicLinkLogin } from "@/components/MagicLinkLogin";
import {
  getGauntletRuns,
  type GauntletRun,
  type GauntletRunResult,
} from "@/lib/gauntlet.functions";

export const Route = createFileRoute("/admin/gauntlet-history")({
  ssr: false,
  head: () => ({
    meta: [{ title: "HELD Admin — Gauntlet History" }, { name: "robots", content: "noindex" }],
  }),
  component: GauntletHistoryPage,
});

function GauntletHistoryPage() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!session) {
    return (
      <MagicLinkLogin
        title="HELD Admin"
        subtitle="Acesso restrito. Enviamos um link de acesso para o seu e-mail."
        redirectPath="/admin/gauntlet-history"
        notice={null}
      />
    );
  }

  return <GauntletHistoryDashboard />;
}

function GauntletHistoryDashboard() {
  const queryClient = useQueryClient();
  const runsFn = useServerFn(getGauntletRuns);
  const [selectedRun, setSelectedRun] = useState<GauntletRun | null>(null);

  const {
    data: runs,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["gauntlet-runs"],
    queryFn: () => runsFn(),
    retry: false,
  });

  const runMutation = useMutation({
    mutationFn: async (): Promise<GauntletRunResult> => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (!currentSession) throw new Error("Sessão expirada, entre novamente.");

      const res = await fetch("/api/gauntlet/run", {
        method: "POST",
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `Erro ao rodar o Gauntlet (${res.status})`);
      return body as GauntletRunResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gauntlet-runs"] });
    },
  });

  const runErrorMessage = runMutation.error ? String((runMutation.error as Error).message) : null;

  async function logout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  }

  const denied = error ? String((error as Error).message).includes("NOT_ADMIN") : false;
  const expired = error ? String((error as Error).message).includes("Unauthorized") : false;

  if (expired) {
    return (
      <MagicLinkLogin
        title="HELD Admin"
        subtitle="Acesso restrito. Enviamos um link de acesso para o seu e-mail."
        redirectPath="/admin/gauntlet-history"
        notice="Sessão expirada, entre novamente."
      />
    );
  }

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

  if (isLoading && !runs) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  const latestRun = runs?.[0];
  const previousRun = runs?.[1];
  const improvement = latestRun && previousRun ? latestRun.avg_score - previousRun.avg_score : 0;

  const trendData = runs
    ? runs
        .slice()
        .reverse()
        .map((run) => ({
          date: new Date(run.timestamp).toLocaleDateString("pt-BR", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          score: run.avg_score,
          passed: run.passed,
        }))
    : [];

  const failureData =
    latestRun && latestRun.results_json
      ? latestRun.results_json
          .filter((r) => !r.passed)
          .slice(0, 5)
          .map((r) => ({ id: r.scenario_id, name: r.name, score: r.score }))
      : [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl font-bold">📊 Gauntlet History</h1>
          <div className="flex gap-2">
            <Button onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
              {runMutation.isPending ? "⏳ Rodando..." : "🚀 Rodar Gauntlet Agora"}
            </Button>
            <Button onClick={() => refetch()}>🔄 Refresh</Button>
            <Button variant="destructive" className="rounded-full" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>

        {runMutation.isPending && (
          <p className="mb-8 text-sm text-muted-foreground">
            Rodando os 50 cenários do Gauntlet, isso leva alguns segundos...
          </p>
        )}

        {runErrorMessage && (
          <p className="mb-8 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {runErrorMessage}
          </p>
        )}

        {runMutation.isSuccess && !runMutation.isPending && (
          <p className="mb-8 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm">
            ✅ Gauntlet concluído: {runMutation.data.passed}/
            {runMutation.data.passed + runMutation.data.failed} passaram (
            {runMutation.data.avg_score.toFixed(1)}%).
          </p>
        )}

        {latestRun && (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Passed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {latestRun.passed}/{latestRun.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  {((latestRun.passed / latestRun.total) * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{latestRun.avg_score.toFixed(1)}%</div>
                {improvement !== 0 && (
                  <p className={`text-xs ${improvement > 0 ? "text-green-600" : "text-red-600"}`}>
                    {improvement > 0 ? "↑" : "↓"} {Math.abs(improvement).toFixed(1)}%
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Last Run</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Date(latestRun.timestamp).toLocaleTimeString("pt-BR")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(latestRun.timestamp).toLocaleDateString("pt-BR")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Runs Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{runs?.length || 0}</div>
                <p className="text-xs text-muted-foreground">histórico</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Score Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {latestRun && (
                  <>
                    <div>🗣️ Voice: {latestRun.voice_score?.toFixed(1) ?? "-"}%</div>
                    <div>🚨 Crisis: {latestRun.crisis_score?.toFixed(1) ?? "-"}%</div>
                    <div>🎯 Conversion: {latestRun.conversion_score?.toFixed(1) ?? "-"}%</div>
                    <div>🔒 Security: {latestRun.security_score?.toFixed(1) ?? "-"}%</div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {failureData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>⚠️ Top Failures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {failureData.map((failure) => (
                  <div key={failure.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">
                        {failure.id} - {failure.name}
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-red-600">{failure.score}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>📋 Run History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Timestamp</th>
                    <th className="text-center py-2">Passed</th>
                    <th className="text-center py-2">Score</th>
                    <th className="text-center py-2">Voice</th>
                    <th className="text-center py-2">Crisis</th>
                  </tr>
                </thead>
                <tbody>
                  {runs?.map((run) => (
                    <tr
                      key={run.id}
                      className="border-b hover:bg-secondary cursor-pointer"
                      onClick={() => setSelectedRun(run)}
                    >
                      <td className="py-2">{new Date(run.timestamp).toLocaleString("pt-BR")}</td>
                      <td className="text-center font-medium">
                        {run.passed}/{run.total}
                      </td>
                      <td className="text-center font-bold">{run.avg_score.toFixed(1)}%</td>
                      <td className="text-center text-sm">{run.voice_score?.toFixed(0) ?? "-"}%</td>
                      <td className="text-center text-sm">
                        {run.crisis_score?.toFixed(0) ?? "-"}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {selectedRun && (
          <p className="mt-4 text-xs text-muted-foreground">
            Run selecionado: {selectedRun.run_id}
          </p>
        )}
      </div>
    </div>
  );
}
