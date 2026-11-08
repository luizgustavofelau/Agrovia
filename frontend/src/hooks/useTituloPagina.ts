import { useEffect } from "react";

/** Mostra o nome da tela na aba do navegador ("Painel · Agrovia"). Sem título, fica só "Agrovia". */
export function useTituloPagina(titulo?: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · Agrovia` : "Agrovia";
  }, [titulo]);
}
