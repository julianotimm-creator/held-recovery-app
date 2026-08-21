import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Valida assinatura Stripe
async function verifyStripeSignature(
  body: string,
  signature: string
): Promise<boolean> {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET não configurada");
  }

  const encoder = new TextEncoder();
  const parts = signature.split(",");
  let timestamp = "";
  let signedContent = "";

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    if (key === "v1") signedContent = value;
  }

  if (!timestamp || !signedContent) {
    return false;
  }

  const computedSignature = await crypto.subtle.sign(
    "HMAC",
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(STRIPE_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    ),
    encoder.encode(`${timestamp}.${body}`)
  );

  const computedHex = Array.from(new Uint8Array(computedSignature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedHex === signedContent;
}

serve(async (req) => {
  // Apenas POST
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 401 });
    }

    const body = await req.text();
    const isValid = await verifyStripeSignature(body, signature);

    if (!isValid) {
      console.error("[stripe-webhook] Invalid signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);
    console.log(`[stripe-webhook] Processing ${event.type}`);

    // Inicializar Supabase admin client
    const supabase = createClient(SUPABASE_URL || "", SUPABASE_SERVICE_ROLE_KEY || "");

    const object = event.data.object;

    // Função auxiliar para atualizar subscription
    async function setPaid(userId: string | null, isPaid: boolean) {
      if (!userId) {
        console.error(`[stripe-webhook] No user_id for event ${event.id}`);
        return;
      }

      const { error } = await supabase
        .from("public.users")
        .update({
          subscription_active: isPaid,
          subscription_status: isPaid ? "active" : "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        throw new Error(
          `Failed to update user ${userId}: ${error.message}`
        );
      }

      console.log(
        `[stripe-webhook] Updated user ${userId} subscription: ${isPaid}`
      );
    }

    // Extrair user_id
    function extractUserId(obj: any): string | null {
      return obj.metadata?.user_id || null;
    }

    // Processar eventos
    switch (event.type) {
      case "checkout.session.completed": {
        let userId = extractUserId(object);
        // Se não tem user_id direto, tenta subscription
        if (!userId && object.subscription) {
          const { data: subscription } = await supabase
            .from("stripe_subscriptions")
            .select("metadata")
            .eq("stripe_id", object.subscription)
            .single();
          userId = subscription?.metadata?.user_id || null;
        }
        await setPaid(userId, true);
        break;
      }

      case "invoice.payment_succeeded":
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const status = object.status;
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
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[stripe-webhook] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
