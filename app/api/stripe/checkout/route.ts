import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body?.userId as string | undefined;
    const email = body?.email as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'HELD - Acesso Ilimitado',
            },
            unit_amount: 9999,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      client_reference_id: userId,
      customer_email: email,
      success_url: 'https://beside-ten.vercel.app/chat',
      cancel_url: 'https://beside-ten.vercel.app/pricing',
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error.message);
    return NextResponse.json({
      error: error.message || 'Falha ao criar sessão',
      details: error
    }, { status: 500 });
  }
}
