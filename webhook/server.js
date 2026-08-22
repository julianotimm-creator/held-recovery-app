import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CRÍTICO: raw body ANTES de json()
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).send('No signature');

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    const obj = event.data.object;
    const userId = obj.metadata?.user_id || obj.client_reference_id;

    if (!userId) return res.json({ ok: true });

    switch (event.type) {
      case 'checkout.session.completed':
      case 'invoice.payment_succeeded':
        await supabase.from('users').update({ subscription_active: true }).eq('id', userId);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const active = obj.status === 'active' || obj.status === 'trialing';
        await supabase.from('users').update({ subscription_active: active }).eq('id', userId);
        break;
      }
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed':
        await supabase.from('users').update({ subscription_active: false }).eq('id', userId);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook error: ${err.message}`);
  }
});

app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook on :${PORT}`));
