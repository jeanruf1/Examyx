import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ProvaAI — Gerador de Provas com IA',
    template: '%s | ProvaAI',
  },
  description: 'Crie provas personalizadas com inteligência artificial em minutos. Alinhadas à BNCC, com suporte a acessibilidade e exportação em PDF.',
  keywords: ['provas', 'educação', 'IA', 'BNCC', 'professor', 'escola'],
  authors: [{ name: 'ProvaAI' }],
  robots: 'index, follow',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
