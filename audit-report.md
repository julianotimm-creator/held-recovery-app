# AUDITORIA HELD — RELATÓRIO COMPLETO
14 ago 2026

> Nota sobre data: o pedido original citava "13 ago 2026"; a data atual do sistema é 14 ago 2026, usada aqui para precisão.

> Nota de confiabilidade: em uma verificação anterior nesta mesma sessão, um comando `git log` retornou um histórico de 5 commits com arquivos `.env*` versionados, que não bateu com uma reverificação posterior via `git reflog` (que mostra apenas 1 commit real). Essa inconsistência não foi explicada. Os dados de git neste relatório refletem a verificação mais recente e direta (`git reflog`, `git ls-files`), mas recomendo confirmar de forma independente direto no GitHub.

---

## 1. ESTRUTURA DO PROJETO

### app/ (610 linhas, 11 arquivos)
```
app/layout.tsx
app/page.tsx
app/pricing/page.tsx
app/chat/page.tsx
app/api/chat/claude/route.ts
app/api/chat/conversations/route.ts
app/api/chat/messages/route.ts
app/api/chat/user/route.ts
app/api/debug/supabase/route.ts   (vazio, 0 bytes)
app/api/stripe/checkout/route.ts
app/api/stripe/webhook/route.ts
```

### components/ (221 linhas, 2 arquivos)
```
components/ChatInterface.tsx
components/LoginForm.tsx
```

### lib/ (65 linhas, 2 arquivos)
```
lib/supabase.ts
lib/recovery-patterns.ts
```

### public/ (0 linhas de código, 3 arquivos estáticos)
```
public/favicon.ico
public/robots.txt
public/sitemap.xml
```

**Total código (app + components + lib): 896 linhas em 15 arquivos.**

Observação estrutural: existe uma segunda árvore de código, `src/` (TanStack Start/Router), que parece ser o app real em desenvolvimento ativo — com rotas, integração Supabase própria, Stripe server-side e lógica de chat/community/admin equivalente. `app/`, `components/` e `lib/` (raiz) parecem ser sobra de um scaffold Next.js anterior, não incluída no build atual (ver seção 4).

---

## 2. ERROS CRÍTICOS

1. **Syntax error em `lib/recovery-patterns.ts`** (linhas 7–46): os valores de `prompt:` em todos os 5 padrões (`paralysis`, `catastrophizing`, `isolation`, `perfectionism`, `overthinking`) são texto multi-linha **sem aspas nem crases** — ex.: `prompt: PADRÃO DETECTADO: Paralisia/Inação\nO usuário não consegue...`. Confirmado via inspeção de bytes brutos (não é problema de encoding). Isso é sintaxe JS/TS inválida — quebra qualquer parser que processe o arquivo.

2. **Imports faltando / funções não definidas — `supabaseRest`**: importado em 5 arquivos diferentes:
   - `app/api/chat/claude/route.ts`
   - `app/api/chat/conversations/route.ts`
   - `app/api/chat/messages/route.ts`
   - `app/api/chat/user/route.ts`
   - `app/api/stripe/webhook/route.ts`

   mas `lib/supabase.ts` só exporta `supabase` (client bruto do `@supabase/supabase-js`). `supabaseRest` não existe em nenhum lugar do repositório. Toda chamada quebra em runtime.

3. **`@anthropic-ai/sdk` não está instalado** (ausente em `node_modules` e em `package.json`), mas é importado diretamente em `app/api/chat/claude/route.ts`.

4. **`app/`, `components/`, `lib/` (raiz) estão fora do `tsconfig.json`** — `include` cobre apenas `src/**/*.ts(x)`. O alias `@/*` aponta para `./src/*`, não para a raiz do projeto, então `@/lib/supabase` nessas rotas nunca resolveria para `lib/supabase.ts` da raiz mesmo se fossem incluídas no type-check.

5. **Nenhum runtime Next.js configurado** — `package.json` só tem scripts Vite (`vite dev`, `vite build`, `vite preview`). `next` e `stripe` estão fisicamente instalados mas marcados como `extraneous` pelo npm (presentes em `node_modules`, ausentes de `package.json`). Nenhuma rota em `app/api/**` roda de fato hoje.

6. **`PricingPage()` (`app/pricing/page.tsx`)**: função definida corretamente (sem erro de digitação), mas usa `useRouter` de `next/navigation` e `Link` de `next/link` — APIs do Next App Router inexistentes sob o runtime Vite/TanStack Start atual. Quebra em runtime por falta de contexto de roteador.

7. **`app/api/debug/supabase/route.ts` vazio** (0 bytes) — rota morta, sem handler.

8. **`components/SignUpAgeGate.tsx` não existe** — `components/LoginForm.tsx` importa `SignUpAgeGate` de `./SignUpAgeGate`, mas nenhum arquivo com esse nome existe em nenhum lugar do repositório (confirmado por busca global). Import quebrado.

**Total: 8 erros (6 críticos de build/runtime, 2 estruturais/menores).**

---

## 3. SEGURANÇA

### Quais `.env*` estão versionados no git?
Verificação atual (`git ls-files | grep '^\.env'`): **nenhum**. `.gitignore` está em UTF-8 e contém a regra `.env.local`, que está funcionando corretamente agora.

### Quais variáveis são secrets (não podem ser públicas)?
| Variável | Deve ficar server-only? |
|---|---|
| `ANTHROPIC_API_KEY` | Sim |
| `SUPABASE_SECRET_KEY` | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim — dá acesso admin ao banco, ignora RLS |
| `STRIPE_SECRET_KEY` | Sim |
| `STRIPE_WEBHOOK_SECRET` | Sim |
| `VERCEL_OIDC_TOKEN` | Sim |
| `NEXT_PUBLIC_SUPABASE_URL` | Não — público por design |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Não — público por design (protegido por RLS) |
| `STRIPE_PUBLISHABLE_KEY` | Não — público por design |
| `NEXT_PUBLIC_APP_URL` | Não — não é secret |

### `NEXT_PUBLIC_*` — análise de risco
- `NEXT_PUBLIC_ANTHROPIC_API_KEY` — **risco real**. O prefixo `NEXT_PUBLIC_` faz o valor ser embutido no bundle client-side se referenciado em qualquer componente. Hoje não é usado em nenhum lugar do código (só declarado no `.env.local`), mas é uma duplicata perigosa de `ANTHROPIC_API_KEY` — deveria ser removida antes que alguém a use por engano.
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — uso correto do padrão `NEXT_PUBLIC_`, essas chaves são desenhadas para serem públicas (a proteção real vem de Row Level Security no Supabase).
- `NEXT_PUBLIC_APP_URL` — sem risco, é só a URL do app.

---

## 4. DEPENDÊNCIAS

### package.json — versões críticas
- `react` ^19.2.0 / `react-dom` ^19.2.0
- `@supabase/supabase-js` ^2.112.0
- `@tanstack/react-router` ^1.170.18, `@tanstack/react-start` ^1.168.32
- `tailwindcss` ^4.2.1
- `vite` ^8.1.5 (dev), `typescript` ^5.8.3 (dev)
- **Não declaradas:** `next`, `stripe`, `@anthropic-ai/sdk`

### Faltam instalar?
- `@anthropic-ai/sdk` — **sim, ausente completamente** (não está em `node_modules` nem em `package.json`). Necessário para `app/api/chat/claude/route.ts` funcionar, caso essa rota seja mantida.

### Conflitos de versão?
- `next@16.3.0` e `stripe@22.4.0` aparecem como **extraneous** (`npm ls`) — instalados fisicamente em `node_modules`, mas não declarados em `package.json`. Isso não é um conflito de versão propriamente dito, mas é uma inconsistência: o projeto depende implicitamente de pacotes que um `npm install` limpo não instalaria, quebrando a build em uma máquina nova.

---

## 5. ARQUIVOS CRÍTICOS — CONTEÚDO

### app/api/stripe/webhook/route.ts (nome correto; `webhook.ts` não existe — é `webhook/route.ts`)
```ts
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
```
*(usa `supabaseRest`, indefinido — erro #2)*

### app/api/chat/claude/route.ts
```ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseRest } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FREE_MESSAGE_LIMIT = 10;

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, preferred_name, userId } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages é obrigatório" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
    }

    const userResult = await supabaseRest("GET", `/users?id=eq.${userId}&select=*`);
    const user = Array.isArray(userResult) ? userResult[0] : userResult;

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const freeMessagesUsed = user.free_messages_used ?? 0;
    const subscriptionActive = user.subscription_active ?? false;

    if (!subscriptionActive && freeMessagesUsed >= FREE_MESSAGE_LIMIT) {
      return NextResponse.json(
        { error: "Limite de mensagens grátis atingido" },
        { status: 403 }
      );
    }

    const systemPrompt = `Você é HELD, um companheiro de IA para recuperação.
Você oferece apoio caloroso e não julgador para pessoas navegando depressão, pânico e dependência.
Responda em português de forma breve (máx 200 tokens), acolhedora e humanizada.
${preferred_name ? `A pessoa se chama ${preferred_name}.` : ""}
Nunca faça diagnósticos, sempre sugira recursos de crise se apropriado (CVV 188 no Brasil; 988 ou 911 nos EUA).`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: systemPrompt,
      messages,
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text : "";

    await supabaseRest("PATCH", `/users?id=eq.${userId}`, {
      free_messages_used: freeMessagesUsed + 1,
      message_count: (user.message_count ?? 0) + 1,
    });

    return NextResponse.json({
      role: "assistant",
      content: text,
      freeMessagesUsed: freeMessagesUsed + 1,
    });
  } catch (error) {
    console.error("Claude error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
```
*(usa `supabaseRest`, indefinido — erro #2; usa `@anthropic-ai/sdk`, não instalado — erro #3)*

### lib/supabase.ts (completo — só tem 5 linhas)
```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### lib/recovery-patterns.ts (completo)
```ts
// lib/recovery-patterns.ts

export const RECOVERY_PATTERNS = {
  paralysis: {
    name: 'paralysis',
    keywords: ['não consigo', 'não aguento', 'não funciona', 'travado', 'congelado', 'paralisado'],
    prompt: PADRÃO DETECTADO: Paralisia/Inação
O usuário não consegue começar ou continuar. Validar que estar parado é uma resposta normal ao sofrimento.
Exemplo: "Ficar na cama é ok. Seu corpo está protegendo você agora."
Técnica invisível: Validação + Curiosidade suave.,
  },

  catastrophizing: {
    name: 'catastrophizing',
    keywords: ['sempre', 'nunca', 'tudo vai', 'vou falhar', 'vai acabar', 'tudo ruim'],
    prompt: PADRÃO DETECTADO: Pensamento Catastrófico
O usuário salta de um problema pra colapso total. Questionar gentilmente sem soar como "técnica".
Exemplo: "Sempre? Nem uma vez que tentou e conseguiu, mesmo que pequeno?"
Técnica invisível: Questionamento socrático naturalizado.,
  },

  isolation: {
    name: 'isolation',
    keywords: ['sozinho', 'ninguém entende', 'ninguém sabe', 'isolado', 'abandonado', 'incompreendido'],
    prompt: PADRÃO DETECTADO: Isolamento
O usuário se sente único na dor. Normalizar sem minimizar.
Exemplo: "Muitos aqui sentem exatamente isso. Você não é estranho por isso."
Técnica invisível: Normalização + Validação.,
  },

  perfectionism: {
    name: 'perfectionism',
    keywords: ['deveria', 'preciso', 'tenho que', 'fracassado', 'fui péssimo', 'sou inútil'],
    prompt: PADRÃO DETECTADO: Perfeccionismo/Culpa
O usuário cobra muito de si. Valorizar esforço mínimo como real.
Exemplo: "Você tentou. Não é perfeito, mas é real e conta."
Técnica invisível: Reframing do esforço.,
  },

  overthinking: {
    name: 'overthinking',
    keywords: ['por que', 'e se', 'mas e', 'não consigo parar de pensar', 'mente acelerada', 'loop'],
    prompt: PADRÃO DETECTADO: Ruminação/Overthinking
O usuário preso em loop de pensamento. Trazer pra presente/ação.
Exemplo: "Sua mente não vai parar sozinha. O que você faria agora se não tivesse que 'pensar certo'?"
Técnica invisível: Redirect da ação.,
  },
};

// Detecta qual padrão o texto pertence
export function detectPattern(text: string): string | null {
  const lowerText = text.toLowerCase();

  for (const [key, pattern] of Object.entries(RECOVERY_PATTERNS)) {
    const matches = pattern.keywords.filter(kw => lowerText.includes(kw)).length;
    if (matches >= 1) return pattern.name; // Detecta com 1+ keywords
  }

  return null;
}
```
*(erro #1 — todos os `prompt:` sem delimitador de string; `detectPattern()` em si está correta)*

### components/LoginForm.tsx (primeiras 40 linhas)
```tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SignUpAgeGate } from './SignUpAgeGate';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [ageGateConfirmed, setAgeGateConfirmed] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      alert(`Erro: ${error.message}`);
    } else {
      setIsSent(true);
    }
    setIsLoading(false);
  };

  if (isSent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">Verifique seu email</h2>
          <p className="text-gray-300 mb-4">
            Enviamos um link de acesso para <strong>{email}</strong>
          </p>
```
*(importa `SignUpAgeGate` de `./SignUpAgeGate` — arquivo confirmado inexistente no repositório, erro #8)*

---

## 6. GIT STATUS

```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

**Últimos commits (via `git reflog`, apenas 1 commit real existe):**
```
bb71d0d Initial commit: HELD - Always Beside AI recovery companion
```

**Branches:**
```
* main
  remotes/origin/main
```

---

## 7. DIAGNÓSTICO FINAL

### Quantos erros total
**8 erros identificados** — 6 críticos (quebram build/runtime), 2 estruturais/menores.

### O que está pronto (%)
- Árvore `src/` (TanStack Start — app real): parece funcional e em desenvolvimento ativo, não auditada linha a linha nesta rodada.
- Árvore `app/`/`components/`/`lib/` (raiz — scaffold Next.js): **~0% funcional** — nenhuma rota roda hoje (nem está no build), e o arquivo de padrões de recuperação nem compila.

### O que quebra a build
- `lib/recovery-patterns.ts` — syntax error, quebra qualquer processo que tente parsear o arquivo (se algum dia for incluído no build).
- `@anthropic-ai/sdk` ausente — quebra `app/api/chat/claude/route.ts` se algum dia for incluído no build.
- `supabaseRest` indefinido — quebra as 5 rotas que o importam.

*(Nenhum desses quebra a build atual do Vite porque `app/`, `components/`, `lib/` estão fora do `tsconfig.json` — mas quebram no instante em que alguém tentar rodá-los.)*

### O que precisa antes de deploy
1. Decidir o destino de `app/`, `components/`, `lib/` (raiz) — provável remoção, já que `src/` parece reimplementar a mesma coisa.
2. Remover `NEXT_PUBLIC_ANTHROPIC_API_KEY` do `.env.local` (risco de vazamento se algum dia for referenciada em código client-side).
3. Confirmar e resolver a inconsistência de `next`/`stripe` como `extraneous` no `npm ls`.
4. Criar `components/SignUpAgeGate.tsx` (confirmado ausente) ou remover a referência em `LoginForm.tsx`, caso essa árvore seja mantida.

### Ordem de priorização
1. **Decisão arquitetural** — manter ou remover `app/`/`components/`/`lib/` (raiz). Isso determina se os outros itens importam.
2. Se removidos: nada mais a corrigir nessa árvore; confirmar que toda a funcionalidade equivalente já existe em `src/`.
3. Se mantidos: corrigir sintaxe de `recovery-patterns.ts` → definir `supabaseRest` → instalar `@anthropic-ai/sdk` → declarar `next`/`stripe` em `package.json` → incluir a árvore no `tsconfig.json` com alias correto.
4. Independente da decisão: remover `NEXT_PUBLIC_ANTHROPIC_API_KEY`.
