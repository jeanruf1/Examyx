import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date))
}

export function formatCurrency(value: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency
  }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function truncate(text: string, length: number) {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Custo OpenAI em USD por 1k tokens
export const TOKEN_COSTS = {
  'gpt-4o':                { input: 0.005,   output: 0.015 },
  'gpt-4o-mini':           { input: 0.00015, output: 0.0006 },
  'text-embedding-ada-002':{ input: 0.0001,  output: 0 },
}

export function calculateCost(model: string, tokensIn: number, tokensOut: number): number {
  const cost = TOKEN_COSTS[model as keyof typeof TOKEN_COSTS]
  if (!cost) return 0
  return (tokensIn / 1000 * cost.input) + (tokensOut / 1000 * cost.output)
}
