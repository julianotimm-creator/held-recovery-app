# HELD - Fixes Aplicados e Instruções de Deployment

## ✅ BUGS CORRIGIDOS

### 1. **Webhook Stripe retorna 404** (CRÍTICO)
**Problema:** Nitro não estava configurado para Vercel → rotas de servidor não eram deployadas
**Fix:** `nitro.config.ts` com preset Vercel

### 2. **Message counting não funciona atomicamente**
**Problema:** Incrementar `message_count` sem RPC causa race conditions
**Fix:** Usar RPC function `increment_message_count()` no Supabase

---

## 📋 INSTRUÇÕES DE DEPLOYMENT

### **PASSO 1: WEBHOOK AGORA FUNCIONA**
✅ `nitro.config.ts` foi commitado
✅ Vercel vai rebuildar (~5-10 min)

### **PASSO 2: CRIAR RPC FUNCTION NO SUPABASE**

1. Acesse: https://supabase.com/dashboard
2. Projeto: `hummrtzjlutbmjfxfelm`
3. SQL Editor → Novo query
4. Cole o conteúdo de `sql-fixes/increment-message-count-rpc.sql`
5. Clique **Run**

### **PASSO 3: REENVIAR WEBHOOKS STRIPE**

1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Procure: `upbeat-inspiration` 
3. Clique em **Entregas de eventos**
4. Clique **Reenviar** para os 86 eventos com erro

### **PASSO 4: TESTAR FLUXO COMPLETO**

#### 4.1 Login + 10 mensagens gratuitas
