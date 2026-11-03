import { apiFetch } from "../services/http";
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { saveSession } from '../services/session';
import { EsqueciSenha } from './EsqueciSenha';
import '../styles/login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessaoExpirada = searchParams.get('sessao') === 'expirada';
  const senhaRedefinida = searchParams.get('senha') === 'redefinida';
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
        saveSession(data.accessToken, data.usuario);
        navigate('/painel', { replace: true });
      } else {
        const dataErro = await response.json().catch(() => ({}));
        const mensagens: Record<number, string> = {
          401: 'E-mail ou senha inválidos.',
          429: 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.',
          503: 'O serviço está temporariamente indisponível. Tente novamente em instantes.',
        };
        setErro(dataErro.mensagem || mensagens[response.status] || 'Não foi possível entrar. Tente novamente.');
      }
    } catch {
      setErro('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
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
            <button type="button" className="login-logo" onClick={() => navigate('/')} aria-label="Voltar para a página inicial">
              <img src={`${process.env.PUBLIC_URL}/img/logo-agrovia.png`} alt="" />
              <span className="login-logo-word">AGRO<span>VIA</span></span>
            </button>
            <h1 className="login-title">Seja bem-vindo</h1>
            <p className="login-subtitle">Entre com suas credenciais para acessar o painel</p>
          </header>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                maxLength={100}
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
                autoComplete="current-password"
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

            {mostrarAjudaSenha && <EsqueciSenha emailInicial={email} />}

            {senhaRedefinida && !erro && (
              <p className="login-info" role="status">
                Senha alterada com sucesso. Entre com a nova senha.
              </p>
            )}

            {sessaoExpirada && !erro && (
              <p className="login-info" role="status">
                Sua sessão expirou. Entre novamente para continuar.
              </p>
            )}

            {erro && (
              <div className="login-error" role="alert">
                <span aria-hidden="true">⚠️</span>
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

          <p className="login-switch">
            Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
          </p>

          <footer className="login-footer">
            © 2026 AgroVia — Tecnologia para o Campo
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;
