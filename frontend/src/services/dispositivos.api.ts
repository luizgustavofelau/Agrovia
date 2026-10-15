import type { Dispositivo } from "../components/DispositivoCard";

export async function listarDispositivos(idUsuario: string): Promise<{ dispositivos: Dispositivo[]; demonstracao: boolean }> {
  const response = await fetch(`/api/dispositivos?id_usuario=${encodeURIComponent(idUsuario)}`);
  if (!response.ok) throw new Error("Não foi possível carregar os dispositivos.");
  return {
    dispositivos: await response.json() as Dispositivo[],
    demonstracao: response.headers.get("X-Data-Source") === "demo",
  };
}

export async function removerDispositivo(id: string | number, accessToken: string): Promise<void> {
  const response = await fetch(`/api/dispositivos/${encodeURIComponent(String(id))}`, {
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