# HELD Webhook Server

Express server que processa webhooks Stripe para HELD recovery app.

## Setup Local

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar .env

Copie `example.env` para `.env` e preencha com suas chaves:

```bash
cp example.env .env
```

Edite `.env` com:
- `STRIPE_SECRET_KEY`: sk_test_... (de https://dashboard.stripe.com/test/apikeys)
- `STRIPE_WEBHOOK_SECRET`: whsec_... (gerado quando criar endpoint no Stripe)
- `SUPABASE_SERVICE_ROLE_KEY`: De https://supabase.com/dashboard → Settings → API

### 3. Rodar localmente

```bash
npm run dev
```

Server vai rodar em `http://localhost:3000`

Teste:
```bash
curl http://localhost:3000/health
```

Esperado: `{"status":"✅ Webhook server is running"}`

---

## Deploy no Render

### 1. Criar novo serviço

Acesse: https://dashboard.render.com/

Clique: **New** → **Web Service**

### 2. Conectar GitHub

- Selecione seu repo `held-recovery-app`
- Branch: `main`

### 3. Configurar

```
Name: held-webhook
Runtime: Node
Build Command: npm install
Start Command: npm start
```

### 4. Adicionar variáveis de ambiente

Clique em **Environment**:

```
STRIPE_SECRET_KEY = sk_test_...
STRIPE_WEBHOOK_SECRET = whsec_...
SUPABASE_URL = https://hummrtzjlutbmjfxfelm.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOi...
PORT = 3000
NODE_ENV = production
```

### 5. Deploy

Clique **Create Web Service**

Render vai:
1. Clonar seu repo
2. Instalar dependências
3. Rodar `npm start`
4. Dar uma URL pública: `https://held-webhook-xxxxx.onrender.com`

Espere 2-3 minutos até "Live" ficar verde.

---

## Testar webhook

### 1. Verificar server

```bash
curl https://YOUR-RENDER-URL/health
```

Esperado: `{"status":"✅ Webhook server is running"}`

### 2. Configurar endpoint no Stripe

1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique **Create an endpoint**
3. URL: `https://YOUR-RENDER-URL/webhook`
4. Events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Clique **Create endpoint**
6. Copie o webhook secret (começa com `whsec_`)
7. Atualize em Render: Environment → `STRIPE_WEBHOOK_SECRET`

### 3. Reenviar webhooks antigos

Stripe Dashboard → Webhooks → Seu endpoint → "Entregas de eventos"

Selecione eventos com status "Failed" → Clique "Reenviar"

---

## Testar fluxo completo

### 1. Fazer pagamento

- Acesse: https://always-beside.com (incógnito)
- Email: test-final@always-beside.com
- Envie 10 mensagens (devem passar)
- 11ª deve ser bloqueada
- Clique "Upgrade"
- Card: 4242 4242 4242 4242
- Exp: 12/25
- CVC: 123

### 2. Verificar logs no Render

Dashboard Render → seu serviço → **Logs**

Você vai ver:

```
📌 [Webhook] Event received: checkout.session.completed
   Event ID: evt_...
   Processing checkout.session.completed
   Updating user user_xxx: subscription_active = true
✅ [Database] User updated successfully
```

### 3. Verificar Supabase

https://supabase.com/dashboard → your project → SQL Editor

```sql
SELECT id, email, subscription_active, updated_at 
FROM public.users 
WHERE id = 'user_xxx'
ORDER BY updated_at DESC 
LIMIT 1;
```

Deve mostrar: `subscription_active = true`

### 4. Testar chat

Volte para https://always-beside.com

Envie mensagem #11 → Deve ser **desbloqueada** agora

---

## Troubleshooting

### Webhook retorna 401 (Invalid signature)

❌ Webhook secret errado

✅ Solução: Copie o `whsec_...` correto do Stripe e atualize em Render

### User não atualiza

❌ SUPABASE_SERVICE_ROLE_KEY inválida

✅ Solução: Copie de https://supabase.com/dashboard → Settings → API → Service role

### "Address already in use"

❌ Porta 3000 já está em uso

✅ Solução: Mude `PORT` em `.env` ou mate o processo: `lsof -i :3000`

---

## Logs úteis

O servidor loga tudo. Em Render, veja:

- ✅ `✅ Webhook server is running` → Server rodando
- 📌 `📌 [Webhook] Event received` → Evento recebido
- ✅ `✅ [Database] User updated` → Sucesso
- ❌ `❌ [Webhook]` → Erro (leia mensagem)

---

## Próximos passos

1. Deploy em Render ✅
2. Configurar webhook no Stripe ✅
3. Reenviar webhooks antigos ✅
4. Testar fluxo de pagamento ✅
5. Rodar Gauntlet 50 scenarios
6. Rotacionar credenciais
7. Ir para produção

---

**Dúvidas?** Veja logs do Render ou teste com:

```bash
curl -X POST https://YOUR-RENDER-URL/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: invalid" \
  -d '{"test": true}'
```

Esperado: `{"error":"Invalid signature"}`
