import { createFileRoute } from "@tanstack/react-router";
import type { StripeEvent } from "@/lib/stripe.server";

export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("stripe-signature");

        const { constructStripeEvent, extractUserId, retrieveSubscription } =
          await import("@/lib/stripe.server");

        let event: StripeEvent;
        try {
          event = await constructStripeEvent(rawBody, signature);
        } catch (error) {
          console.error("[stripe-webhook] signature verification failed", error);
          return new Response("Invalid signature", { status: 401 });
        }

        const object = event.data.object;

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          async function setPaid(userId: string | null, isPaid: boolean) {
            if (!userId) {
              console.error("[stripe-webhook] no user id in event", event.id, event.type);
              return;
            }
            const { error } = await supabaseAdmin
              .from("users")
              .update({
                subscription_active: isPaid,
                subscription_status: isPaid ? "active" : "canceled",
              })
              .eq("id", userId);
            if (error) throw new Error(error.message);
          }

          switch (event.type) {
            case "checkout.session.completed": {
              let userId = extractUserId(object);
              const subscriptionId = object["subscription"];
              if (!userId && typeof subscriptionId === "string") {
                const subscription = await retrieveSubscription(subscriptionId);
                userId = subscription.metadata?.["user_id"] ?? null;
              }
              await setPaid(userId, true);
              break;
            }
            case "invoice.payment_succeeded":
            case "customer.subscription.created":
            case "customer.subscription.updated": {
              const status = object["status"];
              const active = status === undefined || status === "active" || status === "trialing";
              await setPaid(extractUserId(object), active);
              break;
            }
            case "customer.subscription.deleted":
            case "invoice.payment_failed": {
              await setPaid(extractUserId(object), false);
              break;
            }
            default:
              break;
          }
        } catch (error) {
          console.error("[stripe-webhook] handler error", event.type, error);
          return new Response("Webhook handler error", { status: 500 });
        }

        return Response.json({ received: true });
      },
    },
  },
});
