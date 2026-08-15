type Bubble = { from: "held" | "you"; text: string };

const conversation: Bubble[] = [
  {
    from: "held",
    text: "Last Sunday night was hard too. You told me work was usually what started the spiral. Is tonight about work again, or something different?",
  },
  { from: "you", text: "Work again. I can't stop thinking about tomorrow." },
  {
    from: "held",
    text: "I remember. Last time, breaking tomorrow into just the first hour helped. Want to do that again, or would you rather just talk for a while?",
  },
];

export function PhoneMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[2.5rem] border border-border bg-card p-3 shadow-glow">
      <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-border" />
      <div className="space-y-3 rounded-[1.75rem] bg-background p-4">
        <p className="text-center text-[11px] text-muted-foreground">Sunday, 10:47 PM</p>
        {(compact ? conversation.slice(0, 2) : conversation).map((b, i) => (
          <div key={i} className={b.from === "you" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                b.from === "you"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-secondary px-3.5 py-2.5 text-[13px] text-secondary-foreground"
                  : "max-w-[90%] rounded-2xl rounded-bl-sm bg-gradient-to-br from-primary to-accent-strong px-3.5 py-2.5 text-[13px] text-primary-foreground"
              }
            >
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide opacity-80">
                {b.from === "you" ? "You" : "HELD"}
              </span>
              {b.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
