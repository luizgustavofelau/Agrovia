import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/http';
import { saveSession } from '../services/session';
import '../styles/login.css';

const SENHA_MINIMA = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Campos = { nome: string; email: string; telefone: string; senha: string; confirmacao: string };
type Erros = Partial<Record<keyof Campos, string>>;

// Mesmas regras do servidor, para o usuário ver o problema antes de enviar.
function validar(campos: Campos): Erros {
  const erros: Erros = {};
  const senha = campos.senha.trim();
  if (!campos.nome.trim()) erros.nome = 'Informe seu nome.';
  else if (campos.nome.trim().length > 100) erros.nome = 'Use no máximo 100 caracteres.';
  if (!EMAIL_PATTERN.test(campos.email.trim())) erros.email = 'Informe um e-mail válido.';
  if (campos.telefone.trim().length > 20) erros.telefone = 'Use no máximo 20 caracteres.';
  if (senha.length < SENHA_MINIMA || !/[A-Za-zÀ-ÿ]/.test(senha) || !/\d/.test(senha))
    erros.senha = `Use pelo menos ${SENHA_MINIMA} caracteres, com letras e números.`;
  else if (new TextEncoder().encode(senha).length > 72) erros.senha = 'Senha longa demais.';
  if (campos.confirmacao.trim() !== senha) erros.confirmacao = 'As senhas não coincidem.';
  return erros;
}

const Cadastro: React.FC = () => {
  const navigate = useNavigate();
  const [campos, setCampos] = useState<Campos>({ nome: '', email: '', telefone: '', senha: '', confirmacao: '' });
  const [erros, setErros] = useState<Erros>({});
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const atualizar = (campo: keyof Campos) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setCampos((atual) => ({ ...atual, [campo]: event.target.value }));
    if (erros[campo]) setErros((atual) => ({ ...atual, [campo]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErro('');
    const encontrados = validar(campos);
    setErros(encontrados);
    if (Object.keys(encontrados).length) return;

    setCarregando(true);
    try {
      const response = await apiFetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: campos.nome.trim(),
          email: campos.email.trim(),
          telefone: campos.telefone.trim(),
          senha: campos.senha.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        saveSession(data.accessToken, data.usuario);
        navigate('/painel', { replace: true });
        return;
      }
      const mensagens: Record<number, string> = {
        409: 'Este e-mail já está cadastrado. Entre com sua senha.',
        429: 'Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.',
        503: 'O serviço está temporariamente indisponível. Tente novamente em instantes.',
      };
      setErro(data.mensagem || mensagens[response.status] || 'Não foi possível concluir o cadastro.');
    } catch {
      setErro('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const campo = (
    id: keyof Campos,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <div className="form-group">
      <label htmlFor={`cadastro-${id}`}>{label}</label>
      <input
        id={`cadastro-${id}`}
        value={campos[id]}
        onChange={atualizar(id)}
        aria-invalid={Boolean(erros[id])}
        aria-describedby={erros[id] ? `cadastro-${id}-erro` : undefined}
        className={erros[id] ? 'input-invalid' : undefined}
        {...props}
      />
      {erros[id] && <small id={`cadastro-${id}-erro`} className="field-error">{erros[id]}</small>}
    </div>
  );

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

          <h2>Crie sua conta e organize a sua propriedade.</h2>

          <p>
            Depois do cadastro você já entra no painel para registrar fazendas, vincular dispositivos e consultar os estudos agrícolas.
          </p>

          <ul className="login-feature-list">
            <li>Cadastro gratuito de campos e culturas</li>
            <li>Vínculo de dispositivos ESP32 pelo código MAC</li>
            <li>Estudos agrícolas com referências técnicas</li>
          </ul>
        </aside>

        <div className="login-card">
          <header className="login-header">
            <button type="button" className="login-logo" onClick={() => navigate('/')} aria-label="Voltar para a página inicial">
              <img src={`${process.env.PUBLIC_URL}/img/logo-agrovia.png`} alt="" />
              <span className="login-logo-word">AGRO<span>VIA</span></span>
            </button>
            <h1 className="login-title">Criar conta</h1>
            <p className="login-subtitle">Preencha seus dados para começar</p>
          </header>

          <form onSubmit={handleSubmit} className="login-form signup-form" noValidate>
            {campo('nome', 'Nome completo', { type: 'text', autoComplete: 'name', maxLength: 100, required: true, placeholder: 'Seu nome' })}
            {campo('email', 'E-mail', { type: 'email', autoComplete: 'email', maxLength: 100, required: true, placeholder: 'seu@email.com' })}
            {campo('telefone', 'Telefone (opcional)', { type: 'tel', autoComplete: 'tel', maxLength: 20, placeholder: '(00) 00000-0000' })}
            <div className="signup-row">
              {campo('senha', 'Senha', { type: 'password', autoComplete: 'new-password', required: true, placeholder: '••••••••' })}
              {campo('confirmacao', 'Confirmar senha', { type: 'password', autoComplete: 'new-password', required: true, placeholder: '••••••••' })}
            </div>

            {erro && (
              <div className="login-error" role="alert">
                <span aria-hidden="true">⚠️</span>
                <span>{erro}</span>
              </div>
            )}

            <button type="submit" disabled={carregando} className="login-btn">
              {carregando ? (
                <>
                  <div className="spinner" />
                  <span>Criando conta...</span>
                </>
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          <p className="login-switch">
            Já tem uma conta? <Link to="/login">Entrar</Link>
          </p>

          <footer className="login-footer">
            © 2026 AgroVia — Tecnologia para o Campo
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;
