import { MagicLinkLogin } from "@/components/MagicLinkLogin";

export function EmailGate() {
  return (
    <MagicLinkLogin
      title="Entrar no HELD"
      subtitle="Só o e-mail. Sem senha, sem nome real — você recebe um nome anônimo automaticamente."
      redirectPath="/chat"
    />
  );
}
