import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Lock, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HELD — Companheiro de IA anônimo para recuperação" },
      {
        name: "description",
        content:
          "HELD é um companheiro de IA anônimo para recuperação. 10 mensagens grátis, sem cartão de crédito, disponível 24/7.",
      },
      { property: "og:title", content: "HELD — Companheiro de IA para recuperação" },
      {
        property: "og:description",
        content: "Totalmente anônimo. 10 mensagens grátis. Disponível 24 horas por dia.",
      },
      { property: "og:url", content: "https://www.always-beside.com/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.always-beside.com/" }],
  }),
  component: Landing,
});

const bullets = [
  { icon: Lock, title: "Totalmente anônimo", text: "Sem nome real, sem rastros. Só você e a conversa." },
  { icon: Heart, title: "Sem cartão de crédito", text: "10 mensagens gratuitas para começar agora." },
  { icon: Clock, title: "Disponível 24/7", text: "Nas madrugadas difíceis, alguém sempre responde." },
];

function Landing() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-between px-5 py-10">
      <main className="flex w-full max-w-xl flex-1 flex-col items-center justify-center text-center">
        <h1 className="text-6xl font-semibold tracking-tight text-foreground sm:text-7xl">HELD</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Um companheiro de IA para recuperação
        </p>

        <ul className="mt-10 w-full space-y-3 text-left">
          {bullets.map(({ icon: Icon, title, text }) => (
            <li key={title} className="surface-panel flex items-start gap-3 p-4">
              <span className="mt-0.5 rounded-full bg-accent p-2 text-accent-foreground">
                <Icon className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-foreground">{title}</span>
                <span className="block text-sm text-muted-foreground">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        <Link
          to="/chat"
          className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3.5 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
        >
          Começar grátis (10 mensagens)
        </Link>
      </main>

      <footer className="mt-12 max-w-xl text-center text-xs text-muted-foreground">
        Em crise? Ligue ou envie mensagem para a linha de apoio <strong>988</strong> (EUA) — no
        Brasil, CVV <strong>188</strong>. Disponível 24 horas.
      </footer>
    </div>
  );
}
