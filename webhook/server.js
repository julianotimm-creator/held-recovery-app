import express from "express";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "✅ Webhook server is running" });
});

// Webhook endpoint
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    // Verify Stripe signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`❌ [Webhook] Signature verification failed:`, err.message);
    return res.status(401).json({ error: "Invalid signature" });
  }

  console.log(`\n📌 [Webhook] Event received: ${event.type}`);
  console.log(`   Event ID: ${event.id}`);

  try {
    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await handleSubscriptionCreatedOrUpdated(event.data.object);
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event.data.object);
        break;
      }

      case "invoice.payment_succeeded": {
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      }

      case "invoice.payment_failed": {
        await handleInvoicePaymentFailed(event.data.object);
        break;
      }

      default:
        console.log(`ℹ️  [Webhook] Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt of event
    res.json({ received: true });
  } catch (error) {
    console.error(`❌ [Webhook] Error processing event:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Event handlers
async function handleCheckoutSessionCompleted(session) {
  console.log(`   Processing checkout.session.completed`);

  let userId = session.metadata?.user_id;

  if (!userId && session.subscription) {
    // Try to get user_id from subscription metadata
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    userId = subscription.metadata?.user_id;
  }

  if (!userId) {
    console.warn(`⚠️  [Webhook] No user_id found in checkout session ${session.id}`);
    return;
  }

  await updateUserSubscription(userId, true);
}

async function handleSubscriptionCreatedOrUpdated(subscription) {
  console.log(`   Processing subscription event`);

  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.warn(`⚠️  [Webhook] No user_id in subscription ${subscription.id}`);
    return;
  }

  // Only activate if subscription is active or trialing
  const shouldActivate = subscription.status === "active" || subscription.status === "trialing";
  await updateUserSubscription(userId, shouldActivate);
}

async function handleSubscriptionDeleted(subscription) {
  console.log(`   Processing subscription deletion`);

  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.warn(`⚠️  [Webhook] No user_id in subscription ${subscription.id}`);
    return;
  }

  await updateUserSubscription(userId, false);
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log(`   Processing invoice.payment_succeeded`);

  if (!invoice.subscription) {
    console.log(`   No subscription in invoice, skipping`);
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.warn(`⚠️  [Webhook] No user_id in invoice ${invoice.id}`);
    return;
  }

  await updateUserSubscription(userId, true);
}

async function handleInvoicePaymentFailed(invoice) {
  console.log(`   Processing invoice.payment_failed`);

  if (!invoice.subscription) {
    console.log(`   No subscription in invoice, skipping`);
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.warn(`⚠️  [Webhook] No user_id in invoice ${invoice.id}`);
    return;
  }

  await updateUserSubscription(userId, false);
}

// Database update
async function updateUserSubscription(userId, isActive) {
  console.log(`   Updating user ${userId}: subscription_active = ${isActive}`);

  const { error } = await supabase
    .from("public.users")
    .update({
      subscription_active: isActive,
      subscription_status: isActive ? "active" : "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error(`❌ [Database] Error updating user ${userId}:`, error.message);
    throw error;
  }

  console.log(`✅ [Database] User ${userId} updated successfully`);
}

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 HELD Webhook Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Webhook: http://localhost:${PORT}/webhook`);
  console.log(`\n   Waiting for Stripe events...`);
});
