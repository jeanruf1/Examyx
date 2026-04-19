/**
 * Configuração Global de Planos e Limites de Tokens
 * Altere aqui para mudar os padrões que são aplicados ao trocar o plano de uma escola.
 */

export const PLAN_LIMITS = {
  trial: 50000,       // 50k tokens
  basic: 250000,      // 250k tokens
  pro: 1000000,       // 1M tokens
  enterprise: 5000000 // 5M tokens
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

/**
 * Estimativa de custo médio de tokens por prova gerada.
 * Usado para calcular a "Capacidade Restante" no dashboard do professor.
 */
export const AVG_TOKENS_PER_EXAM = 2500; 
