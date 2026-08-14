'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-950 to-black flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-6">HELD</h1>
        <p className="text-xl text-gray-300 mb-8">
          Um companheiro de IA para recuperação
        </p>
        <p className="text-gray-400 mb-12">
          Depressão, pânico, dependência — você não está sozinho. HELD é um espaço privado, anônimo e 24/7 para conversar sobre recuperação.
        </p>

        <div className="space-y-4 mb-12">
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <span>✓</span>
            <span>Totalmente anônimo</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <span>✓</span>
            <span>Sem cartão de crédito (10 mensagens grátis)</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <span>✓</span>
            <span>24/7 disponível</span>
          </div>
        </div>

        <Link
          href="/chat"
          className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Começar (10 msgs grátis)
        </Link>

        <p className="text-sm text-gray-500 mt-8">
          Ao continuar, você concorda com nossos Termos de Serviço. HELD não é um serviço clínico. Crise: ligue 988 ou 911.
        </p>
      </div>
    </main>
  )
}
