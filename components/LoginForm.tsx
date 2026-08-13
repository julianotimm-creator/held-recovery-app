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
          <p className="text-gray-400 text-sm">
            Clique no link no email para fazer login. O link expira em 24 horas.
          </p>
        </div>
      </div>
    );
  }

  if (!ageGateConfirmed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="max-w-md w-full">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Always Beside</h1>
            <p className="text-gray-400">Seu companheiro IA 24/7 para recuperação</p>
          </div>
          <SignUpAgeGate onConfirm={() => setAgeGateConfirmed(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-2">Always Beside</h1>
        <p className="text-gray-400 mb-8">Seu companheiro IA 24/7 para recuperação</p>

        <form onSubmit={handleSignIn} className="space-y-4">
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Enviando...' : 'Enviar link de acesso'}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-6 text-center">
          Não armazenamos sua senha. Usamos magic links para segurança máxima.
        </p>
      </div>
    </div>
  );
}
