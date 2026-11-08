import { apiFetch } from "../services/http";
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Lock, Mail, Radio, Sprout } from 'lucide-react';
import { saveSession } from '../services/session';
import { EsqueciSenha } from './EsqueciSenha';
import { AuthCabecalho, AuthCampo, AuthErro, AuthLayout, SessaoAberta } from './AuthLayout';
import { useTituloPagina } from '../hooks/useTituloPagina';

const destaques = [
  { icone: Sprout, titulo: 'Campos e culturas', detalhe: 'Fazendas, talhões e áreas organizados' },
  { icone: Radio, titulo: 'Sensores ESP32', detalhe: 'Leituras de umidade e status de conexão' },
  { icone: BookOpen, titulo: 'Estudos agrícolas', detalhe: 'Cinco culturas com referências técnicas' },
];

const Login: React.FC = () => {
  useTituloPagina("Entrar");
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
    <AuthLayout
      vitrineTitulo="Irrigação com contexto,"
      vitrineDestaque="do solo ao painel."
      vitrineTexto="Organize campos e dispositivos e consulte estudos agrícolas. As leituras dependem dos sensores e integrações ativos."
      destaques={destaques}
    >
      <AuthCabecalho titulo="Seja bem-vindo" subtitulo="Entre com suas credenciais para acessar o painel" />

      <form onSubmit={handleSubmit} className="login-form">
        {!sessaoExpirada && <SessaoAberta />}

        <AuthCampo
          id="email"
          label="E-mail"
          icone={Mail}
          type="email"
          autoComplete="email"
          maxLength={100}
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <AuthCampo
          id="senha"
          label="Senha"
          icone={Lock}
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button
          type="button"
          className="forgot-password"
          aria-expanded={mostrarAjudaSenha}
          onClick={() => setMostrarAjudaSenha((visible) => !visible)}
        >
          Esqueceu a senha?
        </button>

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

        {erro && <AuthErro>{erro}</AuthErro>}

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
            <>Entrar no Painel <span aria-hidden="true">→</span></>
          )}
        </button>
      </form>

      <p className="login-switch">
        Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
      </p>

      <footer className="login-footer">
        © 2026 AgroVia — Tecnologia para o Campo
      </footer>
    </AuthLayout>
  );
};

export default Login;
