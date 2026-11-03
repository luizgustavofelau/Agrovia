import React, { useState } from "react";
import { apiFetch } from "../services/http";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Painel do "Esqueceu a senha?" dentro do login. Não é um <form> próprio porque
// fica dentro do formulário de login (formulários não podem ser aninhados).
export function EsqueciSenha({ emailInicial }: { emailInicial: string }) {
  const [email, setEmail] = useState(emailInicial);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function enviar() {
    setErro("");
    setMensagem("");
    if (!EMAIL_PATTERN.test(email.trim())) {
      setErro("Informe o e-mail da sua conta.");
      return;
    }
    setEnviando(true);
    try {
      const response = await apiFetch("/api/senha/esqueci", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErro(data.mensagem || "Não foi possível enviar o pedido. Tente novamente.");
        return;
      }
      setMensagem(
        data.envioConfigurado === false
          ? `${data.mensagem} Atenção: o envio de e-mails ainda não foi configurado no servidor; se o link não chegar, procure o administrador.`
          : data.mensagem,
      );
    } catch {
      setErro("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  const aoTeclar = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter aqui envia o pedido de redefinição, e não o login.
    if (event.key === "Enter") {
      event.preventDefault();
      enviar();
    }
  };

  return (
    <div className="forgot-panel" role="group" aria-labelledby="forgot-title">
      <p id="forgot-title" className="forgot-panel-title">Redefinir senha</p>
      <p className="forgot-panel-text">Informe o e-mail da conta. Enviaremos um link para você criar uma nova senha.</p>
      <div className="forgot-panel-row">
        <input
          type="email"
          aria-label="E-mail para redefinir a senha"
          autoComplete="email"
          maxLength={100}
          placeholder="seu@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onKeyDown={aoTeclar}
        />
        <button type="button" className="forgot-panel-btn" onClick={enviar} disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar link"}
        </button>
      </div>
      {mensagem && <p className="forgot-panel-ok" role="status">{mensagem}</p>}
      {erro && <p className="forgot-panel-error" role="alert">{erro}</p>}
    </div>
  );
}
