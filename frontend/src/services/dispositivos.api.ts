import { apiFetch } from "./http";
import type { Dispositivo } from "../components/DispositivoCard";

export async function listarDispositivos(idUsuario: string): Promise<{ dispositivos: Dispositivo[]; demonstracao: boolean }> {
  const response = await apiFetch(`/api/dispositivos?id_usuario=${encodeURIComponent(idUsuario)}`);
  if (!response.ok) throw new Error("Não foi possível carregar os dispositivos.");
  return {
    dispositivos: await response.json() as Dispositivo[],
    demonstracao: response.headers.get("X-Data-Source") === "demo",
  };
}

export async function removerDispositivo(id: string | number, accessToken: string): Promise<void> {
  const response = await apiFetch(`/api/dispositivos/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 204) return;

  const body = await response.json().catch(() => ({}));
  const mensagens: Record<number, string> = {
    401: "Sua sessão expirou. Entre novamente para remover o dispositivo.",
    404: "Dispositivo não encontrado ou sem permissão para removê-lo.",
  };
  throw new Error(body.mensagem || body.message || mensagens[response.status] || "Não foi possível remover o dispositivo.");
}

// ── Integração com o ESP32 ───────────────────────────────────────────────
export type ComandoIrrigacao = {
  id: number;
  acao: "LIGAR" | "DESLIGAR";
  duracaoSegundos: number | null;
  status: "PENDENTE" | "ENVIADO" | "EXECUTADO" | "FALHOU" | "EXPIRADO" | "CANCELADO";
  mensagem: string | null;
  criadoEm: string;
  concluidoEm: string | null;
};

export type LeituraUmidade = { umidade: number; dataHora: string };

async function respostaOuErro<T>(response: Response, padrao: string): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.mensagem || padrao);
  return body as T;
}

export async function gerarChaveDispositivo(id: string | number): Promise<string> {
  const response = await apiFetch(`/api/dispositivos/${encodeURIComponent(String(id))}/chave`, { method: "POST" });
  return (await respostaOuErro<{ chave: string }>(response, "Não foi possível gerar a chave do dispositivo.")).chave;
}

export async function enviarComandoIrrigacao(
  id: string | number,
  acao: "LIGAR" | "DESLIGAR",
  duracaoSegundos?: number,
): Promise<ComandoIrrigacao> {
  const response = await apiFetch(`/api/dispositivos/${encodeURIComponent(String(id))}/comandos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ acao, duracao_segundos: duracaoSegundos }),
  });
  return respostaOuErro<ComandoIrrigacao>(response, "Não foi possível enviar o comando de irrigação.");
}

export async function listarComandos(id: string | number): Promise<ComandoIrrigacao[]> {
  const response = await apiFetch(`/api/dispositivos/${encodeURIComponent(String(id))}/comandos`);
  return respostaOuErro<ComandoIrrigacao[]>(response, "Não foi possível consultar os comandos.");
}

export async function listarLeituras(id: string | number, limite = 48): Promise<LeituraUmidade[]> {
  const response = await apiFetch(`/api/dispositivos/${encodeURIComponent(String(id))}/leituras?limite=${limite}`);
  return respostaOuErro<LeituraUmidade[]>(response, "Não foi possível consultar as leituras.");
}
