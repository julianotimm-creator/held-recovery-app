import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
};

/** 4-digit PIN field rendered as masked dots. */
export function PinInput({ value, onChange, autoFocus, disabled }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <button
      type="button"
      className="relative flex w-full justify-center gap-3 py-2"
      onClick={() => ref.current?.focus()}
      disabled={disabled}
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={
            value.length === i
              ? "flex size-14 items-center justify-center rounded-2xl border-2 border-primary bg-secondary"
              : "flex size-14 items-center justify-center rounded-2xl border border-border bg-secondary"
          }
        >
          <span
            className={
              value.length > i
                ? "size-3 rounded-full bg-primary"
                : "size-3 rounded-full bg-muted-foreground/25"
            }
          />
        </span>
      ))}
      <input
        ref={ref}
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={4}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        className="absolute size-px opacity-0"
        aria-label="PIN de 4 dígitos"
      />
    </button>
  );
}
