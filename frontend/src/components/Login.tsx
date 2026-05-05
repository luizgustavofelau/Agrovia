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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-10 border-t-8 border-green-800">
        {/* Logo / título */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green-800 flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">AV</span>
          </div>
          <h1 className="text-2xl font-bold text-green-900">AgroVia</h1>
          <p className="text-sm text-green-700 mt-1">Acesso ao Sistema</p>
          <p className="text-xs text-gray-400 mt-1">Monitore sua plantação</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
            />
          </div>

          {erro && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-green-800 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 rounded-lg shadow-md transition duration-300 transform hover:scale-[1.02] active:scale-100"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          © 2026 AgroVia — Automação Agrícola
        </p>
      </div>
    </div>
  );
};

export default Login;
