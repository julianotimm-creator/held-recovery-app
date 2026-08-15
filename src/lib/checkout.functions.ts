import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { origin: string }) => input)
  .handler(async ({ data, context }) => {
    const { createSubscriptionCheckoutSession } = await import("@/lib/stripe.server");
    const origin = data.origin.replace(/\/$/, "");

    const url = await createSubscriptionCheckoutSession({
      userId: context.userId,
      email: (context.claims as { email?: string } | undefined)?.email ?? null,
      successUrl: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/checkout?checkout=cancelled`,
    });

    return { url };
  });

/**
 * Fallback for when the Stripe webhook has not (yet) arrived: verifies the
 * checkout session directly with Stripe and unlocks the account if it belongs
 * to the caller and is paid.
 */
export const confirmCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => input)
  .handler(async ({ data, context }) => {
    const { retrieveCheckoutSession } = await import("@/lib/stripe.server");
    const session = await retrieveCheckoutSession(data.sessionId);

    const owner =
      (session["client_reference_id"] as string | null) ??
      (session["metadata"] as Record<string, string> | undefined)?.["user_id"] ??
      null;
    if (owner !== context.userId) return { isPaid: false as boolean };

    const paid =
      session["payment_status"] === "paid" ||
      session["status"] === "complete" ||
      session["payment_status"] === "no_payment_required";
    if (!paid) return { isPaid: false as boolean };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("users")
      .update({ subscription_active: true, subscription_status: "active" })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);

    return { isPaid: true as boolean };
  });
