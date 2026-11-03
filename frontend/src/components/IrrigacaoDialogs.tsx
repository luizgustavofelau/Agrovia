import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Check, Copy, Droplets, KeyRound, LoaderCircle, Power, X } from "lucide-react";
import type { Dispositivo } from "./DispositivoCard";
import {
  enviarComandoIrrigacao,
  gerarChaveDispositivo,
  listarComandos,
  type ComandoIrrigacao,
} from "../services/dispositivos.api";

const DURACOES_MIN = [1, 5, 10, 15, 30];
const ROTULO_STATUS: Record<ComandoIrrigacao["status"], string> = {
  PENDENTE: "Aguardando o aparelho",
  ENVIADO: "Entregue ao aparelho",
  EXECUTADO: "Executado",
  FALHOU: "Falhou no aparelho",
  EXPIRADO: "Expirou (aparelho não buscou)",
  CANCELADO: "Substituído",
};
const COR_STATUS: Record<ComandoIrrigacao["status"], string> = {
  PENDENTE: "bg-amber-50 text-amber-800",
  ENVIADO: "bg-sky-50 text-sky-800",
  EXECUTADO: "bg-emerald-50 text-emerald-800",
  FALHOU: "bg-red-50 text-red-800",
  EXPIRADO: "bg-stone-100 text-stone-600",
  CANCELADO: "bg-stone-100 text-stone-500",
};

function Modal({ titulo, icone, onFechar, ocupado, children }: {
  titulo: string; icone: ReactNode; onFechar: () => void; ocupado?: boolean; children: ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !ocupado) onFechar(); };
    window.addEventListener("keydown", onKeyDown);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = anterior;
    };
  }, [onFechar, ocupado]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251b]/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && !ocupado && onFechar()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="iot-dialog-title"
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <button type="button" onClick={onFechar} disabled={ocupado} aria-label="Fechar"
          className="absolute right-4 top-4 rounded-full p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-50">
          <X size={18} aria-hidden="true" />
        </button>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1f3a2b]/10 text-[#1f3a2b]">{icone}</div>
        <h2 id="iot-dialog-title" className="mt-4 pr-8 text-xl font-semibold text-stone-900">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}

export function IrrigacaoDialog({ dispositivo, onFechar }: { dispositivo: Dispositivo; onFechar: () => void }) {
  const [minutos, setMinutos] = useState(5);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [comandos, setComandos] = useState<ComandoIrrigacao[]>([]);

  const atualizar = useCallback(() => {
    listarComandos(dispositivo.id).then(setComandos).catch(() => undefined);
  }, [dispositivo.id]);

  // Acompanha o andamento enquanto o diálogo está aberto (o aparelho busca a cada ciclo).
  useEffect(() => {
    atualizar();
    const timer = window.setInterval(atualizar, 4000);
    return () => window.clearInterval(timer);
  }, [atualizar]);

  async function enviar(acao: "LIGAR" | "DESLIGAR") {
    setEnviando(true);
    setErro("");
    try {
      await enviarComandoIrrigacao(dispositivo.id, acao, acao === "LIGAR" ? minutos * 60 : undefined);
      atualizar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível enviar o comando.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Irrigação — ${dispositivo.nome}`} icone={<Droplets size={20} aria-hidden="true" />} onFechar={onFechar} ocupado={enviando}>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        O comando fica disponível por 2 minutos para o aparelho buscar. A válvula fecha sozinha ao fim do tempo, mesmo sem internet.
      </p>
      {!dispositivo.online && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          O aparelho está desconectado agora. Se ele não se comunicar em 2 minutos, o comando expira e nada é acionado.
        </p>
      )}

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-stone-700">Duração</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {DURACOES_MIN.map((m) => (
            <button key={m} type="button" aria-pressed={minutos === m} onClick={() => setMinutos(m)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${minutos === m ? "border-[#1f3a2b] bg-[#1f3a2b] text-white" : "border-stone-300 text-stone-700 hover:bg-stone-50"}`}>
              {m} min
            </button>
          ))}
        </div>
      </fieldset>

      {erro && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{erro}</p>}

      <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button type="button" onClick={() => enviar("DESLIGAR")} disabled={enviando}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50">
          <Power size={15} aria-hidden="true" /> Desligar agora
        </button>
        <button type="button" onClick={() => enviar("LIGAR")} disabled={enviando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f3a2b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#254e2c] focus:outline-none focus:ring-2 focus:ring-[#1f3a2b] focus:ring-offset-2 disabled:opacity-70">
          {enviando ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Droplets size={15} aria-hidden="true" />}
          Irrigar por {minutos} min
        </button>
      </div>

      {comandos.length > 0 && (
        <div className="mt-6 border-t border-stone-200 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Últimos comandos</p>
          <ul className="mt-2 space-y-2" aria-live="polite">
            {comandos.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-stone-700">
                  {c.acao === "LIGAR" ? `Ligar ${Math.round((c.duracaoSegundos || 0) / 60)} min` : "Desligar"}
                  <small className="ml-2 text-stone-400">{new Date(c.criadoEm).toLocaleTimeString("pt-BR", { timeStyle: "short" })}</small>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${COR_STATUS[c.status]}`}>{ROTULO_STATUS[c.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}

export function ChaveDispositivoDialog({ dispositivo, onFechar, onGerada }: {
  dispositivo: Dispositivo; onFechar: () => void; onGerada: () => void;
}) {
  const [chave, setChave] = useState("");
  const [gerando, setGerando] = useState(false);
  const [copiada, setCopiada] = useState(false);
  const [erro, setErro] = useState("");

  async function gerar() {
    setGerando(true);
    setErro("");
    try {
      setChave(await gerarChaveDispositivo(dispositivo.id));
      onGerada();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível gerar a chave.");
    } finally {
      setGerando(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(chave);
      setCopiada(true);
    } catch {
      setErro("Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.");
    }
  }

  return (
    <Modal titulo={`Chave do dispositivo — ${dispositivo.nome}`} icone={<KeyRound size={20} aria-hidden="true" />} onFechar={onFechar} ocupado={gerando}>
      {!chave ? (
        <>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            A chave identifica este ESP32 na API. Ela aparece uma única vez; a Agrovia guarda apenas uma versão cifrada.
            {dispositivo.chaveConfigurada && " Gerar uma nova chave desconecta o aparelho até você gravar a nova no firmware."}
          </p>
          {erro && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{erro}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onFechar} disabled={gerando}
              className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={gerar} disabled={gerando}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1f3a2b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#254e2c] disabled:opacity-70">
              {gerando && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
              {dispositivo.chaveConfigurada ? "Gerar nova chave" : "Gerar chave"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Copie e grave em <code className="rounded bg-stone-100 px-1">DEVICE_KEY</code> no arquivo <code className="rounded bg-stone-100 px-1">config.h</code> do firmware. Depois de fechar, ela não poderá ser vista de novo.
          </p>
          <div className="mt-4 break-all rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 font-mono text-xs text-stone-800" data-testid="chave-dispositivo">{chave}</div>
          {erro && <p className="mt-3 text-sm text-red-800" role="alert">{erro}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={copiar}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50">
              {copiada ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
              {copiada ? "Copiada" : "Copiar chave"}
            </button>
            <button type="button" onClick={onFechar}
              className="rounded-xl bg-[#1f3a2b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#254e2c]">Concluir</button>
          </div>
        </>
      )}
    </Modal>
  );
}
