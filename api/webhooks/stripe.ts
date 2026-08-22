import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel parses the body by default, but Stripe signature verification
// needs the exact raw bytes, so the built-in body parser must be disabled.
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"]!);
const supabase = createClient(
  process.env["SUPABASE_URL"]!,
  process.env["SUPABASE_SERVICE_ROLE_KEY"]!
);

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).send('No signature');

  try {
    const rawBody = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env["STRIPE_WEBHOOK_SECRET"]!.trim()
    );

    const obj = event.data.object as any;
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

    return res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
};



