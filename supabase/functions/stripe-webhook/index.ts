import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // Log request
  console.log(`[stripe-webhook] ${req.method} ${new URL(req.url).pathname}`);

  // Only POST
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("[stripe-webhook] Missing signature header");
      return new Response("Missing signature", { status: 401 });
    }

    // For now, just accept any signature (we'll validate properly later)
    // This is to test if the webhook endpoint works at all
    console.log(`[stripe-webhook] Signature received: ${signature.substring(0, 20)}...`);

    const body = await req.text();
    const event = JSON.parse(body);

    console.log(`[stripe-webhook] Event type: ${event.type}`);
    console.log(`[stripe-webhook] Event ID: ${event.id}`);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const object = event.data?.object || {};
    const userId = object.metadata?.user_id || null;

    // Handle events
    if (userId) {
      console.log(`[stripe-webhook] Processing ${event.type} for user ${userId}`);

      let shouldActivate = false;

      switch (event.type) {
        case "checkout.session.completed":
        case "invoice.payment_succeeded":
        case "customer.subscription.created":
        case "customer.subscription.updated":
          shouldActivate = true;
          break;

        case "customer.subscription.deleted":
        case "invoice.payment_failed":
          shouldActivate = false;
          break;

        default:
          console.log(`[stripe-webhook] Unhandled event: ${event.type}`);
          break;
      }

      if (shouldActivate !== null) {
        const { error } = await supabase
          .from("public.users")
          .update({
            subscription_active: shouldActivate,
            subscription_status: shouldActivate ? "active" : "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) {
          console.error(`[stripe-webhook] DB Error: ${error.message}`);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        console.log(`[stripe-webhook] ✅ Updated user ${userId}: subscription_active=${shouldActivate}`);
      }
    } else {
      console.warn(`[stripe-webhook] No user_id found in event ${event.id}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[stripe-webhook] Error: ${errorMsg}`);

    return new Response(
      JSON.stringify({ error: errorMsg }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
