import { createFileRoute } from "@tanstack/react-router";
import type { StripeEvent } from "@/lib/stripe.server";
import { supabaseRest } from "@/lib/supabase";

export const Route = createFileRoute("/api/public/webhooks/stripe")({
  beforeLoad: async ({ context }) => context,
});

function activeStatuses(status: string) {
  return status === "active" || status === "trialing";
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Webhook não configurado" }), {
      status: 400,
    });
  }

  const rawBody = await request.text();

  let event: StripeEvent;
  try {
    const stripe = await import("stripe").then((m) => new m.default(process.env.STRIPE_SECRET_KEY || ""));
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret) as StripeEvent;
  } catch (error) {
    console.error("[STRIPE WEBHOOK] Assinatura inválida:", error);
    return new Response(JSON.stringify({ error: "Assinatura inválida" }), {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.client_reference_id;

        if (userId) {
          await supabaseRest("PATCH", `/users?id=eq.${userId}`, {
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_active: true,
            subscription_status: "active",
          });
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        await supabaseRest("PATCH", `/users?stripe_customer_id=eq.${customerId}`, {
          subscription_active: activeStatuses(status),
          subscription_status: status,
          stripe_subscription_id: subscription.id,
        });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const periodEnd = subscription.items.data[0]?.current_period_end;

        await supabaseRest("PATCH", `/users?stripe_customer_id=eq.${customerId}`, {
          subscription_active: activeStatuses(status),
          subscription_status: status,
          subscription_end_date: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null,
        });
        break;
      }

      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
    });
  } catch (error) {
    console.error("[STRIPE WEBHOOK] Erro ao processar evento:", error);
    return new Response(JSON.stringify({ error: "Erro ao processar evento" }), {
      status: 500,
    });
  }
}