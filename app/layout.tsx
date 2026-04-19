import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Examyx',
    template: '%s | Examyx',
  },
  description: 'Geração de avaliações inteligentes e gestão institucional.',
  keywords: ['provas', 'educação', 'IA', 'BNCC', 'professor', 'escola'],
  authors: [{ name: 'Examyx' }],
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
