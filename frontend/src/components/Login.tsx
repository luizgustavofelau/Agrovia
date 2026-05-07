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
      className="min-h-screen flex items-center justify-end pr-16 md:pr-24"
      style={{
        backgroundImage:
          'url(https://storage.googleapis.com/tagjs-prod.appspot.com/v1/WwTQVoKzHF/sfr7kh1l_expires_30_days.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'left top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for readability on left side */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Login Card */}
      <div className="relative z-10 flex flex-col items-start bg-[#34A853] py-[2.7rem] px-9 rounded-[20px] w-full max-w-[403px] shadow-2xl">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-6 self-center">
          <img
            src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/WwTQVoKzHF/0axiwvd3_expires_30_days.png"
            alt="AgroVia Logo"
            className="w-16 h-[53px] object-fill"
          />
        </div>

        {/* Welcome text */}
        <span className="text-white text-3xl font-bold mb-2 self-center">
          Seja Bem-vindo
        </span>
        <span className="text-white text-xl font-bold mb-8 self-center opacity-90">
          Entrar no Agrovia
        </span>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {/* Email input */}
          <div className="flex flex-col gap-1">
            <label className="text-white text-sm font-semibold opacity-80 pl-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-white bg-[#034510] text-base font-medium py-3 px-4 rounded-[20px] border-0 outline-none placeholder-white/50 focus:ring-2 focus:ring-white/30 transition"
            />
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1">
            <label className="text-white text-sm font-semibold opacity-80 pl-1">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="text-white bg-[#034510] text-base font-medium py-3 px-4 rounded-[20px] border-0 outline-none placeholder-white/50 focus:ring-2 focus:ring-white/30 transition"
            />
          </div>

          {/* Forgot password */}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-white text-sm font-bold opacity-80 hover:opacity-100 transition bg-transparent border-0 cursor-pointer"
            >
              Esqueceu a senha?
            </button>
          </div>

          {/* Error message */}
          {erro && (
            <div className="flex items-start gap-2 bg-red-500/20 border border-red-400/30 text-white rounded-xl px-4 py-3 text-sm">
              <span>⚠️</span>
              <span>{erro}</span>
            </div>
          )}

          {/* Login button */}
          <button
            id="btn-entrar"
            type="submit"
            disabled={carregando}
            className="w-full bg-[#0059E0] hover:bg-[#0047b8] disabled:opacity-60 text-white text-base font-bold py-3 rounded-[30px] border-0 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 shadow-lg mt-1"
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
              'Entrar'
            )}
          </button>
        </form>

        <p className="text-white/50 text-xs text-center w-full mt-8">
          © 2026 AgroVia — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default Login;
