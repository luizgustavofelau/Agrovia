import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), senha: senha.trim() }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('usuarioNome', data.usuario.nome);
        localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
        navigate('/painel');
      } else {
        setErro('E-mail ou senha incorretos. Tente novamente.');
      }
    } catch {
      setErro('Servidor não está respondendo. Verifique se o Node.js está rodando.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #022c22 0%, #064e3b 45%, #065f46 100%)" }}
    >
      {/* Subtle grid texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 40px,#fff 40px,#fff 41px), repeating-linear-gradient(90deg,transparent,transparent 40px,#fff 40px,#fff 41px)",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Glow behind card */}
        <div className="absolute -inset-1 bg-brand-600/20 blur-2xl rounded-3xl" />

        {/* Glass card */}
        <div className="relative glass-card-dark rounded-3xl px-10 py-12">

          {/* Logo mark */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-lg mb-5">
              <span className="text-white font-display font-extrabold text-xl tracking-tight">AV</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-surface-100 tracking-tight">
              AgroVia
            </h1>
            <p className="mt-1.5 text-surface-400 text-sm font-light">
              Sistema de Irrigação Inteligente
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 mb-8" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest text-surface-400 mb-2">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-surface-100 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition duration-150 text-sm"
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-xs font-semibold uppercase tracking-widest text-surface-400 mb-2">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                required
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-surface-100 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition duration-150 text-sm"
              />
            </div>

            {erro && (
              <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl px-4 py-3 text-sm">
                <span className="mt-0.5">⚠️</span>
                <span>{erro}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-brand-700 hover:bg-brand-600 disabled:bg-brand-900 disabled:opacity-50 text-white font-semibold tracking-wide py-3 rounded-xl shadow-lg transition duration-200 hover:scale-[1.02] active:scale-100 mt-2 text-sm"
            >
              {carregando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Entrando...
                </span>
              ) : (
                'Entrar na Plataforma'
              )}
            </button>
          </form>

          <p className="text-center text-surface-600 text-xs mt-8">
            © 2026 AgroVia — Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
