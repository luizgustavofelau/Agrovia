import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Eye, EyeOff, LucideIcon } from "lucide-react";
import "../styles/login.css";

const LOGO_SRC = `${process.env.PUBLIC_URL}/img/logo-agrovia.png`;
const FOTO_SRC = `${process.env.PUBLIC_URL}/img/fundo-login.jpg`;

type Destaque = { icone?: LucideIcon; titulo: string; detalhe: string };

type AuthLayoutProps = {
  /** Título da vitrine; `destaque` aparece em verde neon na segunda linha. */
  vitrineTitulo?: string;
  vitrineDestaque?: string;
  vitrineTexto?: string;
  destaques?: Destaque[];
  /** Cartão mais largo e enxuto, para formulários longos (cadastro). */
  compacto?: boolean;
  children: React.ReactNode;
};

/**
 * Divisa em onda entre a foto e o formulário, com o fio neon das ondas da página inicial.
 * No computador a onda é vertical (borda esquerda do painel); no celular, horizontal (topo).
 */
const OndaDivisa: React.FC = () => (
  <>
    <svg className="auth-onda auth-onda--vertical" viewBox="0 0 120 1440" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M120 0H50C2 260 26 500 58 720C90 940 8 1180 66 1440H120Z" />
      <path className="auth-onda-linha" d="M50 0C2 260 26 500 58 720C90 940 8 1180 66 1440" />
    </svg>
    <svg className="auth-onda auth-onda--horizontal" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 70C260 118 500 94 720 62C940 30 1180 112 1440 54V120H0Z" />
      <path className="auth-onda-linha" d="M0 70C260 118 500 94 720 62C940 30 1180 112 1440 54" />
    </svg>
  </>
);

/**
 * Moldura das telas de entrada (login, cadastro e nova senha), com a identidade da página
 * inicial: foto do campo com o título grande à esquerda e o formulário num painel escuro
 * à direita. Sem `vitrineTitulo`, mostra só o formulário centralizado.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ vitrineTitulo, vitrineDestaque, vitrineTexto, destaques = [], compacto = false, children }) => (
  <div className={`auth-page${vitrineTitulo ? "" : " auth-page--single"}${compacto ? " auth-page--compacto" : ""}`}>
    {vitrineTitulo && (
      <aside className="auth-vitrine" style={{ "--auth-foto": `url(${FOTO_SRC})` } as React.CSSProperties}>
        <Link to="/" className="auth-marca" aria-label="Agrovia, voltar para a página inicial">
          <img src={LOGO_SRC} alt="" width="38" height="38" />
          <span className="auth-marca-palavra">AGRO<span>VIA</span></span>
        </Link>

        <div className="auth-vitrine-conteudo">
          <p className="auth-eyebrow">Irrigação inteligente</p>
          <h2>
            {vitrineTitulo} {vitrineDestaque && <span className="auth-neon">{vitrineDestaque}</span>}
          </h2>
          {vitrineTexto && <p className="auth-vitrine-texto">{vitrineTexto}</p>}

          {destaques.length > 0 && (
            <ul className="auth-destaques">
              {destaques.map(({ titulo, detalhe }) => (
                <li key={titulo}>
                  <strong>{titulo}</strong>
                  <small>{detalhe}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    )}

    <main className="auth-lado-form">
      {vitrineTitulo && <OndaDivisa />}
      <Link to="/" className="auth-voltar">
        <ArrowLeft size={15} aria-hidden="true" /> Voltar ao início
      </Link>
      <div className={`login-card${compacto ? " login-card--compacto" : ""}`}>{children}</div>
    </main>
  </div>
);

/** Cabeçalho do cartão: logo (volta à página inicial), título e subtítulo. */
export const AuthCabecalho: React.FC<{ titulo: string; subtitulo: string }> = ({ titulo, subtitulo }) => {
  const navigate = useNavigate();
  return (
    <header className="login-header">
      <button type="button" className="login-logo" onClick={() => navigate("/")} aria-label="Voltar para a página inicial">
        <img src={LOGO_SRC} alt="" />
        <span className="login-logo-word">AGRO<span>VIA</span></span>
      </button>
      <h1 className="login-title">{titulo}</h1>
      <p className="login-subtitle">{subtitulo}</p>
    </header>
  );
};

type AuthCampoProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icone: LucideIcon;
  erro?: string;
};

/**
 * Campo com ícone à esquerda. Em campos de senha, um botão alterna entre mostrar e ocultar
 * o texto. A mensagem de erro fica ligada ao campo por aria-describedby.
 */
export const AuthCampo: React.FC<AuthCampoProps> = ({ id, label, icone: Icone, erro, type = "text", className, onKeyUp, onBlur, ...props }) => {
  const [visivel, setVisivel] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const senha = type === "password";
  const avisoCaps = senha && capsLock;
  const descricao = [erro && `${id}-erro`, avisoCaps && `${id}-caps`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <div className={`auth-input${erro ? " auth-input--erro" : ""}`}>
        <Icone className="auth-input-icone" size={18} aria-hidden="true" />
        <input
          id={id}
          type={senha && visivel ? "text" : type}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descricao}
          className={className}
          // Em senhas, avisa quando o Caps Lock está ligado (causa comum de "senha inválida").
          onKeyUp={(event) => {
            if (senha) setCapsLock(event.getModifierState("CapsLock"));
            onKeyUp?.(event);
          }}
          onBlur={(event) => {
            setCapsLock(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {senha && (
          <button
            type="button"
            className="auth-olho"
            onClick={() => setVisivel((v) => !v)}
            aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={visivel}
          >
            {visivel ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
      {erro && <small id={`${id}-erro`} className="field-error">{erro}</small>}
      {avisoCaps && (
        <small id={`${id}-caps`} className="auth-caps" role="status">
          <AlertTriangle size={13} aria-hidden="true" /> Caps Lock está ativado
        </small>
      )}
    </div>
  );
};

/** Caixa de erro do formulário, com ícone no estilo do site. */
export const AuthErro: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="login-error" role="alert">
    <AlertTriangle size={18} aria-hidden="true" className="login-error-icone" />
    <span>{children}</span>
  </div>
);

/** Aviso exibido quando já existe uma sessão aberta neste navegador. */
export const SessaoAberta: React.FC = () => {
  const nome = localStorage.getItem("usuarioNome");
  if (!nome) return null;
  return (
    <p className="login-info" role="status">
      Você já entrou como <strong>{nome}</strong>. <Link to="/painel">Ir para o painel →</Link>
    </p>
  );
};

/** Regras de senha (iguais às do servidor) mostradas como lista que acende ao serem cumpridas. */
export const RegrasSenha: React.FC<{ senha: string; minimo: number; confirmacao?: string }> = ({ senha, minimo, confirmacao }) => {
  const s = senha.trim();
  const regras = [
    { ok: s.length >= minimo, texto: `${minimo}+ caracteres` },
    { ok: /[A-Za-zÀ-ÿ]/.test(s), texto: "Letras" },
    { ok: /\d/.test(s), texto: "Números" },
  ];
  // A barra mede só a força; "senhas iguais" entra na lista quando há confirmação.
  const cumpridas = regras.filter((r) => r.ok).length;
  if (confirmacao !== undefined)
    regras.push({ ok: Boolean(s) && confirmacao.trim() === s, texto: "Senhas iguais" });
  return (
    <div className="auth-forca" aria-live="polite">
      <div className="auth-forca-barra" data-nivel={cumpridas}>
        <span /><span /><span />
      </div>
      <ul>
        {regras.map((r) => (
          <li key={r.texto} className={r.ok ? "is-ok" : undefined}>
            <span aria-hidden="true">{r.ok ? "✓" : "•"}</span> {r.texto}
            <span className="sr-only">{r.ok ? " (atendido)" : " (pendente)"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
