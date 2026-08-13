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
