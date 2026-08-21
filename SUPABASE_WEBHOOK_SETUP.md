# SETUP: Stripe Webhook via Supabase Edge Function

## ⚠️ IMPORTANTE
Este é a mudança definitiva de webhook: Vercel serverless → Supabase Edge Function

Se algo der errado, você pode reverter para:
```bash
git reset --hard backup-before-supabase-webhook
```

---

## 📋 PASSO A PASSO

### 1. Deploy Supabase Function via CLI

```bash
cd seu-projeto
npx supabase functions deploy stripe-webhook --project-id hummrtzjlutbmjfxfelm
```

Se não tem CLI instalado:
```bash
npm install -g supabase
supabase login
supabase functions deploy stripe-webhook --project-id hummrtzjlutbmjfxfelm
```

**Output esperado:**
```
✅ Function deployed successfully
Endpoint: https://hummrtzjlutbmjfxfelm.supabase.co/functions/v1/stripe-webhook
```

### 2. Configurar Variáveis de Ambiente no Supabase

Acesse: https://supabase.com/dashboard/project/hummrtzjlutbmjfxfelm/settings/functions

Clique em "Stripe Webhook" → "Secrets"

Adicione:
```
STRIPE_WEBHOOK_SECRET = whsec_BqZyQSctcXGV4lqRs5F5iPtxlRKcHXJg
SUPABASE_URL = https://hummrtzjlutbmjfxfelm.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1bW1ydHpqbHV0Ym1qZnhmZWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTA4NzY1NCwiZXhwIjoyMTAwNjYzNjU0fQ.RfZAXmeKz1O1KSuCU2m2wZ_sqt8uKyvcX_TNyw7v9Lg
```

### 3. Testar Function (antes de configurar Stripe)

```bash
curl -X POST https://hummrtzjlutbmjfxfelm.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: invalid" \
  -d '{"test": true}'
```

**Esperado:** HTTP 401 (signature inválida)

### 4. Configurar Webhook no Stripe Dashboard

Acesse: https://dashboard.stripe.com/test/webhooks

Clique em **"Create an endpoint"** (botão azul)

**Webhook URL:**
```
https://hummrtzjlutbmjfxfelm.supabase.co/functions/v1/stripe-webhook
```

**Events to send:**
- ✅ checkout.session.completed
- ✅ customer.subscription.created
- ✅ customer.subscription.updated
- ✅ customer.subscription.deleted
- ✅ invoice.payment_succeeded
- ✅ invoice.payment_failed

**Signing secret:** (Stripe vai gerar)
Copie e substitua em seu `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_novo_valor_gerado
```

### 5. Reenviar Webhooks Anteriores

Acesse: https://dashboard.stripe.com/test/webhooks

Clique no webhook recém-criado

Desça para "Entregas de eventos"

Filtre por "Failed" → Selecione todos → Click "Reenviar"

### 6. Testar Flow Completo

```
1. Acesse: https://always-beside.com (incógnito)
2. Email: test-final@always-beside.com
3. Envie 10 mensagens (devem passar)
4. 11ª deve ser bloqueada
5. Click "Upgrade"
6. Card: 4242 4242 4242 4242
7. Verque Supabase: subscription_active = TRUE
8. Chat deve desbloquear para unlimited
```

---

## 🔍 DEBUGGING

Se webhook não funciona:

### Ver logs no Supabase

```bash
supabase functions list --project-id hummrtzjlutbmjfxfelm
supabase functions logs stripe-webhook --project-id hummrtzjlutbmjfxfelm
```

### Ver eventos Stripe

Dashboard Stripe → Webhooks → Endpoint → "Entregas de eventos"

Se mostra "Sent" mas "Response: 5xx" → erro na function

### Ver banco de dados

```bash
# Supabase Dashboard → SQL Editor
SELECT * FROM public.users WHERE id = 'user_xxx'
ORDER BY updated_at DESC LIMIT 5;
```

Procure por `subscription_active = true` após teste de pagamento.

---

## ✅ VALIDAÇÃO FINAL

Quando tudo estiver pronto:

1. **Webhook respondendo?**
   - ✅ HTTP 401 para signature inválida
   - ✅ HTTP 200 para evento válido

2. **Banco atualiza?**
   - ✅ subscription_active muda para TRUE
   - ✅ updated_at atualiza

3. **Chat desbloqueia?**
   - ✅ Mensagens após pagamento não são bloqueadas
   - ✅ Fluxo end-to-end funciona

---

## 🔄 REVERTER SE ALGO QUEBRAR

```bash
git reset --hard backup-before-supabase-webhook
git push --force origin main
```

Isso volta para a última versão (que tinha 404, mas código estava "limpo").
