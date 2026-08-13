import { useEffect, useState } from "react";
import { Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PinInput } from "@/components/PinInput";
import {
  clearPin,
  enrollBiometric,
  hasPin,
  isBiometricAvailable,
  isBiometricEnrolled,
  savePin,
  verifyBiometric,
  verifyPin,
} from "@/lib/pin-store";

type Step = "loading" | "create" | "confirm" | "created" | "unlock" | "forgot";

type Props = {
  userKey: string;
  email?: string | undefined;
  onUnlocked: () => void;
};

export function PinGate({ userKey, email, onUnlocked }: Props) {
  const [step, setStep] = useState<Step>("loading");
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [resetEmail, setResetEmail] = useState(email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStep(hasPin(userKey) ? "unlock" : "create");
    void isBiometricAvailable().then(setBioAvailable);
  }, [userKey]);

  function reset(next: Step) {
    setPin("");
    setError(null);
    setStep(next);
  }

  async function submitCreate() {
    if (pin.length !== 4) return setError("Digite 4 números.");
    setFirstPin(pin);
    setPin("");
    setError(null);
    setStep("confirm");
  }

  async function submitConfirm() {
    if (pin.length !== 4) return setError("Digite 4 números.");
    if (pin !== firstPin) {
      setPin("");
      setFirstPin("");
      setError("PINs não conferem, tente novamente");
      setStep("create");
      return;
    }
    setBusy(true);
    await savePin(userKey, pin);
    setBusy(false);
    setPin("");
    setError(null);
    setSuccess("PIN criado com sucesso! Memorize.");
    setStep("created");
  }

  async function submitUnlock() {
    if (pin.length !== 4) return setError("Digite 4 números.");
    setBusy(true);
    const ok = await verifyPin(userKey, pin);
    setBusy(false);
    if (ok) onUnlocked();
    else {
      setPin("");
      setError("PIN incorreto, tente novamente");
    }
  }

  async function useBiometrics() {
    setError(null);
    setBusy(true);
    const ok = isBiometricEnrolled(userKey)
      ? await verifyBiometric(userKey)
      : await enrollBiometric(userKey);
    setBusy(false);
    if (ok) onUnlocked();
    else setError("Biometria não reconhecida. Use seu PIN.");
  }

  function submitForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) return setError("Informe seu e-mail.");
    clearPin(userKey);
    setFirstPin("");
    window.alert(`Enviamos instruções para ${resetEmail.trim()}. Crie um novo PIN agora.`);
    setSuccess(null);
    reset("create");
  }

  const shell = (children: React.ReactNode) => (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-10">
      <div className="surface-panel p-6">{children}</div>
    </div>
  );

  const feedback = (
    <>
      {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}
      {success && <p className="mt-4 text-center text-sm text-success">{success}</p>}
    </>
  );

  if (step === "loading") {
    return shell(<p className="text-center text-sm text-muted-foreground">Carregando...</p>);
  }

  if (step === "forgot") {
    return shell(
      <form onSubmit={submitForgot} className="space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Esqueci meu PIN</h1>
        <p className="text-sm text-muted-foreground">
          Informe seu e-mail para receber instruções e criar um novo PIN.
        </p>
        <Input
          type="email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          placeholder="voce@email.com"
        />
        <Button type="submit" className="w-full rounded-full">
          Enviar novo PIN
        </Button>
        <button
          type="button"
          className="w-full text-xs text-muted-foreground underline"
          onClick={() => reset(hasPin(userKey) ? "unlock" : "create")}
        >
          Voltar
        </button>
        {feedback}
      </form>,
    );
  }

  if (step === "created") {
    return shell(
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Tudo certo</h1>
        <p className="text-sm text-success">PIN criado com sucesso! Memorize.</p>
        <Button className="w-full rounded-full" onClick={onUnlocked}>
          Entrar no chat
        </Button>
      </div>,
    );
  }

  const isCreate = step === "create";
  const isConfirm = step === "confirm";

  return shell(
    <div className="space-y-4">
      <h1 className="text-center text-2xl font-semibold text-foreground">
        {isCreate
          ? "Crie seu PIN de 4 dígitos"
          : isConfirm
            ? "Confirme seu PIN digitando novamente"
            : "Digite seu PIN de 4 dígitos"}
      </h1>
      <p className="text-center text-sm text-muted-foreground">
        {isCreate
          ? "Escolha 4 números que só você saiba. Ele fica guardado apenas neste dispositivo."
          : isConfirm
            ? "Digite os mesmos 4 números para confirmar."
            : "Use o PIN que você escolheu."}
      </p>

      <PinInput value={pin} onChange={setPin} autoFocus disabled={busy} />

      <Button
        className="w-full rounded-full"
        disabled={busy || pin.length !== 4}
        onClick={() => {
          if (isCreate) void submitCreate();
          else if (isConfirm) void submitConfirm();
          else void submitUnlock();
        }}
      >
        {isCreate ? "Confirmar este PIN" : isConfirm ? "Confirmar" : "Entrar"}
      </Button>

      {step === "unlock" && bioAvailable && (
        <div className="rounded-2xl border border-border p-3 text-center">
          <p className="text-sm text-foreground">Ou usar impressão digital?</p>
          <div className="mt-2 flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 rounded-full"
              disabled={busy}
              onClick={() => void useBiometrics()}
            >
              <Fingerprint className="mr-1 size-4" /> Sim
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-full"
              onClick={() => setError(null)}
            >
              Não
            </Button>
          </div>
        </div>
      )}

      {step === "unlock" && (
        <button
          type="button"
          className="w-full text-xs text-muted-foreground underline"
          onClick={() => reset("forgot")}
        >
          Esqueci meu PIN
        </button>
      )}

      {feedback}
    </div>,
  );
}
