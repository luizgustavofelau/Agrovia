import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Eye, EyeOff, LucideIcon } from "lucide-react";
import { ChuvaDistante, IrrigadorTopo } from "./HeroIrrigacao";
import "../styles/login.css";

type Destaque = { icone: LucideIcon; titulo: string; detalhe: string };

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
 * Moldura das telas de entrada (login, cadastro e nova senha), com a identidade da página
 * inicial: malha neon com chuva ao fundo, o irrigador girando na vitrine e o cartão de vidro.
 * Sem `vitrineTitulo`, mostra só o cartão centralizado.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ vitrineTitulo, vitrineDestaque, vitrineTexto, destaques = [], compacto = false, children }) => (
  <div className="auth-page">
    <div className="auth-fundo" aria-hidden="true">
      <ChuvaDistante />
    </div>

    <Link to="/" className="auth-voltar">
      <ArrowLeft size={16} aria-hidden="true" /> Voltar ao início
    </Link>

    <div className={`auth-shell${vitrineTitulo ? "" : " auth-shell--single"}${compacto ? " auth-shell--largo" : ""}`}>
      {vitrineTitulo && (
        <aside className="auth-vitrine">
          <div className="auth-irrigador" aria-hidden="true">
            <span className="auth-orbita" />
            <span className="auth-orbita auth-orbita--interna" />
            <IrrigadorTopo />
          </div>

          <span className="auth-pill">Agrovia IoT</span>
          <h2>
            {vitrineTitulo} {vitrineDestaque && <span className="auth-neon">{vitrineDestaque}</span>}
          </h2>
          {vitrineTexto && <p className="auth-vitrine-texto">{vitrineTexto}</p>}

          {destaques.length > 0 && (
            <ul className="auth-destaques">
              {destaques.map(({ icone: Icone, titulo, detalhe }) => (
                <li key={titulo}>
                  <span className="auth-destaque-icone"><Icone size={20} aria-hidden="true" /></span>
                  <div>
                    <strong>{titulo}</strong>
                    <small>{detalhe}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}

      <div className={`login-card${compacto ? " login-card--compacto" : ""}`}>{children}</div>
    </div>
  </div>
);

/** Cabeçalho do cartão: logo (volta à página inicial), título e subtítulo. */
export const AuthCabecalho: React.FC<{ titulo: string; subtitulo: string }> = ({ titulo, subtitulo }) => {
  const navigate = useNavigate();
  return (
    <header className="login-header">
      <button type="button" className="login-logo" onClick={() => navigate("/")} aria-label="Voltar para a página inicial">
        <img src={`${process.env.PUBLIC_URL}/img/logo-agrovia.png`} alt="" />
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
