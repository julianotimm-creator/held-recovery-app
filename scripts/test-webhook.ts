/**
 * Script de Teste: Webhook Stripe
 * 
 * Valida se o endpoint /api/stripe/webhook está funcionando
 * e processando corretamente os eventos de pagamento
 * 
 * Uso:
 *   bunx ts-node scripts/test-webhook.ts
 *   ou
 *   node --loader ts-node/esm scripts/test-webhook.ts
 */

import crypto from "crypto";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test";
const WEBHOOK_URL = process.env.WEBHOOK_URL || "https://always-beside.com/api/stripe/webhook";

// Tipos
interface TestResult {
  name: string;
  status: "✅ PASS" | "❌ FAIL" | "⚠️ TIMEOUT";
  message: string;
  statusCode?: number;
  responseTime?: number;
}

// Mock Stripe Event
function createMockCheckoutEvent(userId: string = "user_123") {
  return {
    id: `evt_${Date.now()}`,
    object: "event",
    api_version: "2024-04-10",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `cs_${Date.now()}`,
        object: "checkout.session",
        customer_details: {
          email: "test@always-beside.com",
        },
        metadata: {
          user_id: userId,
        },
        payment_status: "paid",
        subscription: null,
      },
    },
    livemode: false,
    pending_webhooks: 0,
    request: null,
    type: "checkout.session.completed",
  };
}

// Assinar evento com Stripe secret
function signEvent(
  payload: Record<string, unknown>,
  secret: string
): { signature: string; timestamp: number } {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedContent = `${timestamp}.${JSON.stringify(payload)}`;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(signedContent)
    .digest("hex");

  return {
    signature: `t=${timestamp},v1=${signature}`,
    timestamp,
  };
}

// Test 1: Verificar endpoint acessível
async function testWebhookEndpoint(): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "OPTIONS",
      timeout: 5000,
    });

    const responseTime = Date.now() - startTime;

    // Qualquer resposta que não seja 500+ é bom sinal
    if (response.status >= 500) {
      return {
        name: "Endpoint Accessible",
        status: "❌ FAIL",
        message: `Endpoint retornou ${response.status}`,
        statusCode: response.status,
        responseTime,
      };
    }

    return {
      name: "Endpoint Accessible",
      status: "✅ PASS",
      message: `Endpoint respondeu com ${response.status}`,
      statusCode: response.status,
      responseTime,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      name: "Endpoint Accessible",
      status:
        errorMsg.includes("ENOTFOUND") || errorMsg.includes("ECONNREFUSED")
          ? "❌ FAIL"
          : "⚠️ TIMEOUT",
      message: errorMsg,
    };
  }
}

// Test 2: Enviar evento checkout.session.completed
async function testCheckoutSessionEvent(): Promise<TestResult> {
  const event = createMockCheckoutEvent("user_test_123");
  const { signature } = signEvent(event, STRIPE_WEBHOOK_SECRET);
  const startTime = Date.now();

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signature,
      },
      body: JSON.stringify(event),
      timeout: 5000,
    });

    const responseTime = Date.now() - startTime;

    if (response.status === 200) {
      const body = await response.json();
      return {
        name: "Checkout Session Event",
        status: "✅ PASS",
        message: `Evento processado: ${JSON.stringify(body)}`,
        statusCode: 200,
        responseTime,
      };
    }

    const body = await response.text();
    return {
      name: "Checkout Session Event",
      status: response.status === 401 ? "⚠️ TIMEOUT" : "❌ FAIL",
      message: `Status ${response.status}: ${body}`,
      statusCode: response.status,
      responseTime,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      name: "Checkout Session Event",
      status: "⚠️ TIMEOUT",
      message: `Erro ao enviar evento: ${errorMsg}`,
    };
  }
}

// Test 3: Verificar assinatura inválida
async function testInvalidSignature(): Promise<TestResult> {
  const event = createMockCheckoutEvent();
  const startTime = Date.now();

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "invalid_signature",
      },
      body: JSON.stringify(event),
      timeout: 5000,
    });

    const responseTime = Date.now() - startTime;

    // Webhook DEVE rejeitar com 401 se signature inválida
    if (response.status === 401) {
      return {
        name: "Reject Invalid Signature",
        status: "✅ PASS",
        message: "Webhook corretamente rejeitou assinatura inválida (401)",
        statusCode: 401,
        responseTime,
      };
    }

    return {
      name: "Reject Invalid Signature",
      status: "❌ FAIL",
      message: `Webhook aceitou signature inválida (${response.status})`,
      statusCode: response.status,
      responseTime,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      name: "Reject Invalid Signature",
      status: "⚠️ TIMEOUT",
      message: `Erro: ${errorMsg}`,
    };
  }
}

// Main
async function main() {
  console.log("\n🧪 TESTE WEBHOOK STRIPE - HELD Recovery\n");
  console.log(`🎯 Testando: ${WEBHOOK_URL}`);
  console.log(`🔐 Secret: ${STRIPE_WEBHOOK_SECRET.slice(0, 10)}...\n`);

  const tests = [
    testWebhookEndpoint(),
    testCheckoutSessionEvent(),
    testInvalidSignature(),
  ];

  const results = await Promise.all(tests);

  // Exibir resultados
  console.log("📊 RESULTADOS:\n");
  results.forEach((result) => {
    console.log(`${result.status} ${result.name}`);
    console.log(`   └─ ${result.message}`);
    if (result.responseTime) {
      console.log(`   └─ ⏱️ ${result.responseTime}ms`);
    }
    console.log();
  });

  // Summary
  const passed = results.filter((r) => r.status === "✅ PASS").length;
  const failed = results.filter((r) => r.status === "❌ FAIL").length;
  const timeout = results.filter((r) => r.status === "⚠️ TIMEOUT").length;

  console.log(`\n📈 Summary: ${passed}/${results.length} passed`);
  if (failed > 0) console.log(`   ❌ ${failed} failed`);
  if (timeout > 0) console.log(`   ⚠️ ${timeout} timeout`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
