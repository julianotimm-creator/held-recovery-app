import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { EmailGate } from "@/components/EmailGate";
import { createCheckoutSession } from "@/lib/checkout.functions";

export const Route = createFileRoute("/checkout")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Subscribe — HELD" },
      {
        name: "description",
        content: "Unlock unlimited messages with HELD for a simple monthly price.",
      },
      { property: "og:title", content: "Subscribe — HELD" },
      { property: "og:description", content: "Unlimited, anonymous messages, 24/7." },
      { property: "og:url", content: "https://www.always-beside.com/checkout" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.always-beside.com/checkout" }],
  }),
  component: CheckoutPage,
});

const perks = ["Unlimited Messages", "Saved and Private History", "HELD Internal Community"];

function CheckoutPage() {
  const { session, loading } = useSession();
  const startCheckout = useServerFn(createCheckoutSession);
  const [submitting, setSubmitting] = useState(false);

  async function handleCheckout() {
    setSubmitting(true);
    try {
      const { url } = await startCheckout({ data: { origin: window.location.origin } });
      window.location.href = url;
    } catch (error) {
      console.error(error);
      toast.error("Couldn't open payment. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!session) return <EmailGate />;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="surface-panel p-6">
        <h1 className="text-2xl font-semibold text-foreground">Continue the Conversation</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your free messages have ended. Subscribe to unlimited HELD for US$ 69.99/month — founding
          member price for the first 100 subscribers.
        </p>

        <ul className="mt-6 space-y-2">
          {perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2 text-sm text-foreground">
              <Check className="size-4 text-primary" />
              {perk}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={handleCheckout}
          disabled={submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitting ? "Processing payment..." : "Subscribe for US$ 69.99/month"}
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Secure payment processed by Stripe.
        </p>

        <div className="mt-6 space-y-2 text-center">
          <Link to="/chat" className="block text-sm text-muted-foreground underline">
            Back to Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
