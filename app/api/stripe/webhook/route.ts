import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseRest } from '@/lib/supabase';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

function activeStatuses(status: Stripe.Subscription.Status) {
  return status === 'active' || status === 'trialing';
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook não configurado' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('[STRIPE WEBHOOK] Assinatura inválida:', error);
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;

        if (userId) {
          await supabaseRest('PATCH', `/users?id=eq.${userId}`, {
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_active: true,
            subscription_status: 'active',
          });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const periodEnd = subscription.items.data[0]?.current_period_end;

        await supabaseRest('PATCH', `/users?stripe_customer_id=eq.${customerId}`, {
          subscription_active: activeStatuses(status),
          subscription_status: status,
          subscription_end_date: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        });
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[STRIPE WEBHOOK] Erro ao processar evento:', error);
    return NextResponse.json({ error: 'Erro ao processar evento' }, { status: 500 });
  }
}
