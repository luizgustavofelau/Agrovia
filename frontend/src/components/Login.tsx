import { apiFetch } from "../services/http";
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarAjudaSenha, setMostrarAjudaSenha] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const response = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), senha: senha.trim() }),
      });
      if (response.ok) {
        const data = await response.json();
        console.info('[LOGIN] Acesso autorizado.');
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('usuarioId', String(data.usuario.id));
        localStorage.setItem('usuarioNome', data.usuario.nome);
        localStorage.setItem('usuarioLogado', JSON.stringify(data.usuario));
        navigate('/painel');
      } else {
        const dataErro = await response.json().catch(() => ({}));
        setErro(dataErro.mensagem || 'E-mail ou senha incorretos. Tente novamente.');
      }
    } catch {
      setErro('Servidor não está respondendo. Verifique se o Node.js está rodando.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div 
      className="login-page"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(14, 26, 15, 0.6) 0%, var(--dark) 100%), url('${process.env.PUBLIC_URL}/img/fundo-login.jpg')`
      }}
    >
      <div className="login-overlay" />

      <div className="login-shell">
        <aside className="login-showcase">
          <div className="login-showcase-top">
            <span className="login-pill">Agrovia IoT</span>
          </div>

          <h2>Controle inteligente da irrigação em uma única plataforma.</h2>

          <p>
            Organize campos e dispositivos e consulte estudos agrícolas. Leituras em tempo real dependem de sensores e integrações ativos.
          </p>

          <ul className="login-feature-list">
            <li>Organização de campos e culturas cadastrados</li>
            <li>Consulta aos dispositivos registrados</li>
            <li>Estudos agrícolas com referências técnicas</li>
          </ul>

          <div className="login-metrics">
            <div>
              <strong>5</strong>
              <span>Culturas nos estudos</span>
            </div>
            <div>
              <strong>API</strong>
              <span>Cadastros e integrações identificados</span>
            </div>
          </div>
        </aside>

        <div className="login-card">
          <header className="login-header">
            <div className="login-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <img src={`${process.env.PUBLIC_URL}/img/logo-agrovia.png`} alt="Agrovia Logo" />
              AGRO<span>VIA</span>
            </div>
            <h1 className="login-title">Seja bem-vindo</h1>
            <p className="login-subtitle">Entre com suas credenciais para acessar o painel</p>
          </header>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                required
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="forgot-password"
                aria-expanded={mostrarAjudaSenha}
                onClick={() => setMostrarAjudaSenha((visible) => !visible)}
              >
                Esqueceu a senha?
              </button>
            </div>

            {mostrarAjudaSenha && (
              <p className="login-info" role="status">
                A recuperação de senha ainda não está disponível no modo demonstração. Procure o administrador do sistema.
              </p>
            )}

            {erro && (
              <div className="login-error">
                <span>⚠️</span>
                <span>{erro}</span>
              </div>
            )}

            <button
              id="btn-entrar"
              type="submit"
              disabled={carregando}
              className="login-btn"
            >
              {carregando ? (
                <>
                  <div className="spinner" />
                  <span>Entrando...</span>
                </>
              ) : (
                'Entrar no Painel'
              )}
            </button>
          </form>

          <footer className="login-footer">
            © 2026 AgroVia — Tecnologia para o Campo
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;
