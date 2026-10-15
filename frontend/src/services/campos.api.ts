export async function excluirFazenda(id: string | number, accessToken: string): Promise<void> {
  const response = await fetch(`/api/fazendas/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 204) return;

  const body = await response.json().catch(() => ({}));
  if (response.status === 401) throw new Error("Sua sessão expirou. Entre novamente para excluir a propriedade.");
  if (response.status === 404) throw new Error("Propriedade não encontrada ou sem permissão para excluí-la.");
  throw new Error(body.mensagem || "Não foi possível excluir a propriedade. Tente novamente.");
}