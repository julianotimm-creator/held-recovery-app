'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        router.push('/chat');
        return;
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });

      const checkoutData = await response.json();

      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      } else {
        alert('Erro ao criar sessão de pagamento');
      }
    } catch (error) {
      alert('Erro ao conectar com Stripe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-600 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">HELD</h1>
          <p className="text-purple-200">Um companheiro de IA para recuperação</p>
        </div>

        <div className="bg-purple-800 bg-opacity-50 backdrop-blur-md rounded-2xl p-8 border border-purple-500 border-opacity-50">
          <div className="text-center mb-8">
            <p className="text-purple-200 text-sm mb-2">Acesso Ilimitado</p>
            <div className="text-5xl font-bold text-white mb-2">
              $99<span className="text-2xl text-purple-200">/mês</span>
            </div>
            <p className="text-purple-300 text-sm">Cancelar a qualquer momento</p>
          </div>

          <ul className="space-y-4 mb-8 text-purple-100">
            <li className="flex items-center"><span className="text-pink-400 mr-3">✓</span>Chat ilimitado</li>
            <li className="flex items-center"><span className="text-pink-400 mr-3">✓</span>Histórico persistente</li>
            <li className="flex items-center"><span className="text-pink-400 mr-3">✓</span>Discord privado</li>
            <li className="flex items-center"><span className="text-pink-400 mr-3">✓</span>Masterminds semanais</li>
            <li className="flex items-center"><span className="text-pink-400 mr-3">✓</span>100% anônimo</li>
          </ul>

          <form onSubmit={handleCheckout}>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50">
              {loading ? 'Processando...' : 'Começar Agora'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-purple-300 hover:text-purple-100 text-sm underline">Voltar ao chat</Link>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-purple-300 text-xs">Em crise? <a href="tel:988" className="text-pink-400 underline">Ligue 988</a> (EUA) ou <a href="tel:911" className="text-pink-400 underline">911</a></p>
          <p className="text-purple-400 text-xs mt-2">HELD não é terapia. É um companheiro de suporte.</p>
        </div>
      </div>
    </div>
  );
}
