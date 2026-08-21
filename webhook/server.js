import express from "express";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CRÍTICO: raw body ANTES de json()
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      console.error("[webhook] Missing stripe-signature");
      return res.status(400).send("Missing signature");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("[webhook] Signature verification failed:", err.message);
      return res.status(400).send("Webhook verification failed");
    }

    console.log("[webhook] Event verified:", event.id, event.type);

    try {
      const object = event.data.object;

      async function setPaid(userId, isPaid) {
        if (!userId) {
          console.error("[webhook] no user id", event.id, event.type);
          return;
        }
        console.log(`[webhook] Setting ${userId} subscription_active=${isPaid}`);
        const { error } = await supabase
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
          const userId =
            object.client_reference_id || object?.metadata?.["user_id"];
          await setPaid(userId, true);
          break;
        }

        case "invoice.payment_succeeded": {
          const userId = object?.metadata?.["user_id"];
          await setPaid(userId, true);
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const userId = object?.metadata?.["user_id"];
          const active =
            object.status === "active" ||
            object.status === "trialing" ||
            !object.status;
          await setPaid(userId, active);
          break;
        }

        case "customer.subscription.deleted":
        case "invoice.payment_failed": {
          const userId = object?.metadata?.["user_id"];
          await setPaid(userId, false);
          break;
        }
      }

      return res.json({ received: true });
    } catch (error) {
      console.error("[webhook] handler error", event.type, error);
      return res.status(500).json({ error: "Handler error" });
    }
  }
);

app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
