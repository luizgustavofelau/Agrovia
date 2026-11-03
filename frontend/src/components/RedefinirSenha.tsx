import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../services/http";
import "../styles/login.css";

const SENHA_MINIMA = 8;

// O token chega no fragmento do link (#token=...), que não é enviado ao servidor nos logs.
const lerToken = () => new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token") || "";

function validarSenha(senha: string, confirmacao: string) {
  const s = senha.trim();
  if (s.length < SENHA_MINIMA || !/[A-Za-zÀ-ÿ]/.test(s) || !/\d/.test(s))
    return `Use pelo menos ${SENHA_MINIMA} caracteres, com letras e números.`;
  if (new TextEncoder().encode(s).length > 72) return "Senha longa demais.";
  if (confirmacao.trim() !== s) return "As senhas não coincidem.";
  return "";
}

const RedefinirSenha: React.FC = () => {
  const navigate = useNavigate();
  const [token] = useState(lerToken);
  const [estado, setEstado] = useState<"verificando" | "valido" | "invalido">(token ? "verificando" : "invalido");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Tira o token da barra de endereço assim que ele é lido.
  useEffect(() => {
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelado = false;
    apiFetch("/api/senha/validar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => { if (!cancelado) setEstado(r.ok ? "valido" : "invalido"); })
      .catch(() => { if (!cancelado) { setEstado("valido"); } });
    return () => { cancelado = true; };
  }, [token]);

  async function enviar(event: React.FormEvent) {
    event.preventDefault();
    const problema = validarSenha(senha, confirmacao);
    setErro(problema);
    if (problema) return;
    setSalvando(true);
    try {
      const response = await apiFetch("/api/senha/redefinir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, senha: senha.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        navigate("/login?senha=redefinida", { replace: true });
        return;
      }
      if (response.status === 400 && /Link inválido/.test(data.mensagem || "")) setEstado("invalido");
      setErro(data.mensagem || "Não foi possível alterar a senha.");
    } catch {
      setErro("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="login-page"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(14, 26, 15, 0.6) 0%, var(--dark) 100%), url('${process.env.PUBLIC_URL}/img/fundo-login.jpg')`
      }}
    >
      <div className="login-overlay" />
      <div className="login-shell login-shell--single">
        <div className="login-card">
          <header className="login-header">
            <button type="button" className="login-logo" onClick={() => navigate("/")} aria-label="Voltar para a página inicial">
              <img src={`${process.env.PUBLIC_URL}/img/logo-agrovia.png`} alt="" />
              <span className="login-logo-word">AGRO<span>VIA</span></span>
            </button>
            <h1 className="login-title">Nova senha</h1>
            <p className="login-subtitle">
              {estado === "invalido" ? "Este link não pode mais ser usado" : "Crie uma nova senha para a sua conta"}
            </p>
          </header>

          {estado === "verificando" && <p className="login-info" role="status">Verificando o link...</p>}

          {estado === "invalido" && (
            <div className="login-form">
              <p className="login-error" role="alert">
                <span aria-hidden="true">⚠️</span>
                <span>O link é inválido, já foi usado ou expirou (vale por 30 minutos). Peça um novo em “Esqueceu a senha?” na tela de login.</span>
              </p>
              <Link to="/login" className="login-btn login-btn--link">Ir para o login</Link>
            </div>
          )}

          {estado === "valido" && (
            <form onSubmit={enviar} className="login-form" noValidate>
              <div className="form-group">
                <label htmlFor="nova-senha">Nova senha</label>
                <input id="nova-senha" type="password" autoComplete="new-password" required placeholder="••••••••"
                  value={senha} onChange={(e) => setSenha(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="confirmar-senha">Confirmar nova senha</label>
                <input id="confirmar-senha" type="password" autoComplete="new-password" required placeholder="••••••••"
                  value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
              </div>
              <p className="field-hint">Pelo menos {SENHA_MINIMA} caracteres, com letras e números.</p>
              {erro && (
                <div className="login-error" role="alert">
                  <span aria-hidden="true">⚠️</span>
                  <span>{erro}</span>
                </div>
              )}
              <button type="submit" className="login-btn" disabled={salvando}>
                {salvando ? (<><div className="spinner" /><span>Salvando...</span></>) : "Salvar nova senha"}
              </button>
            </form>
          )}

          <p className="login-switch">Lembrou a senha? <Link to="/login">Entrar</Link></p>
          <footer className="login-footer">© 2026 AgroVia — Tecnologia para o Campo</footer>
        </div>
      </div>
    </div>
  );
};

export default RedefinirSenha;
