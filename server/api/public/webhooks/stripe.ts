import type { StripeEvent } from "@/lib/stripe.server";

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== "POST") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method Not Allowed",
    });
  }

  const rawBody = await readRawBody(event);
  const signature = getHeader(event, "stripe-signature");

  const { constructStripeEvent, extractUserId, retrieveSubscription } =
    await import("@/lib/stripe.server");

  let stripeEvent: StripeEvent;
  try {
    stripeEvent = await constructStripeEvent(rawBody, signature);
  } catch (error) {
    console.error("[stripe-webhook] signature verification failed", error);
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid signature",
    });
  }

  const object = stripeEvent.data.object;

  try {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    async function setPaid(userId: string | null, isPaid: boolean) {
      if (!userId) {
        console.error(
          "[stripe-webhook] no user id in event",
          stripeEvent.id,
          stripeEvent.type
        );
        return;
      }
      const { error } = await supabaseAdmin
        .from("public.users")
        .update({
          subscription_active: isPaid,
          subscription_status: isPaid ? "active" : "canceled",
        })
        .eq("id", userId);
      if (error) throw new Error(error.message);
    }

    switch (stripeEvent.type) {
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
        const active =
          status === undefined ||
          status === "active" ||
          status === "trialing";
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
    console.error("[stripe-webhook] handler error", stripeEvent.type, error);
    throw createError({
      statusCode: 500,
      statusMessage: "Webhook handler error",
    });
  }

  return { received: true };
});
