// Server-only Stripe helpers (fetch-based, Worker compatible).
// Secrets are read inside functions, never at module scope.

const STRIPE_API = "https://api.stripe.com/v1";

function secretKey(): string {
  const key = process.env["STRIPE_TEST_API_KEY"] ?? process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("Missing Stripe secret key");
  return key;
}

async function stripeRequest<T>(
  path: string,
  init?: { method?: string; body?: Record<string, string> },
): Promise<T> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    ...(init?.body ? { body: new URLSearchParams(init.body).toString() } : {}),
  });

  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message ?? "Stripe request failed");
  return payload;
}

export type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verifies the `stripe-signature` header against the raw request body.
 * Returns the parsed event, or throws when the signature is invalid/expired.
 */
export async function constructStripeEvent(
  rawBody: string,
  signatureHeader: string | null,
  toleranceSeconds = 300,
): Promise<StripeEvent> {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  if (!signatureHeader) throw new Error("Missing stripe-signature header");

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [k, ...rest] = part.trim().split("=");
      return [k ?? "", rest.join("=")];
    }),
  ) as Record<string, string>;

  const timestamp = parts["t"];
  const provided = parts["v1"];
  if (!timestamp || !provided) throw new Error("Malformed stripe-signature header");

  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (!Number.isFinite(age) || Math.abs(age) > toleranceSeconds) {
    throw new Error("Stripe signature timestamp outside tolerance");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );

  if (!timingSafeEqual(toHex(digest), provided)) throw new Error("Invalid Stripe signature");

  return JSON.parse(rawBody) as StripeEvent;
}

export async function retrieveCheckoutSession(sessionId: string) {
  return stripeRequest<Record<string, unknown>>(`/checkout/sessions/${sessionId}`);
}

export async function retrieveSubscription(subscriptionId: string) {
  return stripeRequest<{ status: string; customer: string; metadata?: Record<string, string> }>(
    `/subscriptions/${subscriptionId}`,
  );
}

export async function retrieveCustomer(customerId: string) {
  return stripeRequest<{ email?: string; metadata?: Record<string, string> }>(
    `/customers/${customerId}`,
  );
}

/** Best-effort extraction of the app user id carried through Stripe metadata. */
export function extractUserId(object: Record<string, unknown>): string | null {
  const metadata = (object["metadata"] ?? {}) as Record<string, string>;
  return metadata["user_id"] ?? metadata["supabase_user_id"] ?? (object["client_reference_id"] as string) ?? null;
}

export const PLAN_NAME = "HELD Ilimitado";
export const PLAN_AMOUNT_CENTS = 9999;
export const PLAN_CURRENCY = "usd";

/** Creates a Stripe Checkout Session for the $99.99/month subscription. */
export async function createSubscriptionCheckoutSession(params: {
  userId: string;
  email: string | null;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const body: Record<string, string> = {
    mode: "subscription",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.userId,
    "metadata[user_id]": params.userId,
    "subscription_data[metadata][user_id]": params.userId,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": PLAN_CURRENCY,
    "line_items[0][price_data][unit_amount]": String(PLAN_AMOUNT_CENTS),
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][price_data][product_data][name]": PLAN_NAME,
  };
  if (params.email) body["customer_email"] = params.email;

  const session = await stripeRequest<{ url?: string }>("/checkout/sessions", {
    method: "POST",
    body,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}
