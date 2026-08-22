import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CRÍTICO: raw body ANTES de json() para validar assinatura Stripe
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  // Log de entrada (para debugging remoto)
  console.log(`[WEBHOOK] Evento recebido. Signature presente: ${!!sig}`);

  if (!sig) {
    console.error('[WEBHOOK] ERROR: Signature ausente');
    return res.status(400).send('No signature');
  }

  try {
    // Validar assinatura Stripe
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`[WEBHOOK] Evento validado: ${event.type}`);

    const obj = event.data.object;

    // Extrair user ID de diferentes locais dependendo do tipo de evento
    let userId = null;
    if (event.type === 'checkout.session.completed') {
      userId = obj.client_reference_id;
    } else if (event.type === 'invoice.payment_succeeded') {
      userId = obj.metadata?.user_id;
    } else if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      userId = obj.metadata?.user_id;
    } else if (event.type === 'invoice.payment_failed') {
      userId = obj.metadata?.user_id;
    }

    if (!userId) {
      console.warn(`[WEBHOOK] WARN: Nenhum user_id encontrado no evento ${event.type}`);
      return res.json({ ok: true, warning: 'no user_id found' });
    }

    console.log(`[WEBHOOK] Processando para user_id: ${userId}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        console.log(`[WEBHOOK] checkout.session.completed → subscription_active=true para ${userId}`);
        const { error } = await supabase
          .from('users')
          .update({ subscription_active: true })
          .eq('id', userId);
        if (error) throw new Error(`Supabase error: ${error.message}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        console.log(`[WEBHOOK] invoice.payment_succeeded → subscription_active=true para ${userId}`);
        const { error } = await supabase
          .from('users')
          .update({ subscription_active: true })
          .eq('id', userId);
        if (error) throw new Error(`Supabase error: ${error.message}`);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const active = obj.status === 'active' || obj.status === 'trialing';
        console.log(`[WEBHOOK] ${event.type} → subscription_active=${active} para ${userId}`);
        const { error } = await supabase
          .from('users')
          .update({ subscription_active: active })
          .eq('id', userId);
        if (error) throw new Error(`Supabase error: ${error.message}`);
        break;
      }

      case 'customer.subscription.deleted': {
        console.log(`[WEBHOOK] customer.subscription.deleted → subscription_active=false para ${userId}`);
        const { error } = await supabase
          .from('users')
          .update({ subscription_active: false })
          .eq('id', userId);
        if (error) throw new Error(`Supabase error: ${error.message}`);
        break;
      }

      case 'invoice.payment_failed': {
        console.log(`[WEBHOOK] invoice.payment_failed → subscription_active=false para ${userId}`);
        const { error } = await supabase
          .from('users')
          .update({ subscription_active: false })
          .eq('id', userId);
        if (error) throw new Error(`Supabase error: ${error.message}`);
        break;
      }

      default:
        console.log(`[WEBHOOK] Evento ignorado: ${event.type}`);
    }

    console.log(`[WEBHOOK] ✓ Evento ${event.type} processado com sucesso`);
    res.json({ received: true, event_type: event.type });

  } catch (err) {
    console.error(`[WEBHOOK] ✗ ERROR: ${err.message}`);
    console.error(`[WEBHOOK] Stack: ${err.stack}`);
    res.status(400).json({ error: err.message });
  }
});

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('[HEALTH] Health check OK');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 HELD Webhook Server iniciado na porta ${PORT}`);
  console.log(`📍 Endpoint: https://held-webhook.onrender.com/webhook`);
  console.log(`🔑 Stripe Secret: ${process.env.STRIPE_WEBHOOK_SECRET ? 'CONFIGURADO ✓' : 'FALTA ✗'}`);
  console.log(`🗄️  Supabase URL: ${process.env.SUPABASE_URL ? 'CONFIGURADO ✓' : 'FALTA ✗'}`);
  console.log(`🔐 Supabase Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CONFIGURADO ✓' : 'FALTA ✗'}\n`);
});
