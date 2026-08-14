import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'HELD — Recovery AI Community',
  description: 'Suporte anônimo 24/7 para quem enfrenta depressão, pânico e dependência.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
