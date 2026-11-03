const SESSION_KEYS = ["accessToken", "usuarioId", "usuarioNome", "usuarioLogado"];

export interface SessionUser {
  id: number | string;
  nome: string;
  email: string;
  telefone?: string | null;
  tipo: string;
}

// Usado após login e após cadastro: a API devolve o mesmo formato nos dois casos.
export function saveSession(accessToken: string, usuario: SessionUser) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("usuarioId", String(usuario.id));
  localStorage.setItem("usuarioNome", usuario.nome);
  localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
}

export function clearSession() {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

// Token vencido ou inválido: limpa a sessão local e volta ao login com aviso.
export function handleExpiredSession() {
  if (!localStorage.getItem("accessToken")) return;
  clearSession();
  window.location.assign(`${process.env.PUBLIC_URL}/login?sessao=expirada`);
}
