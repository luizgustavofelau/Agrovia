import { useEffect, useRef, useState } from "react";
import { Cpu, Ellipsis, MapPin, Trash2, Wifi, WifiOff } from "lucide-react";

export type Dispositivo = {
  id: string | number;
  nome: string;
  mac?: string;
  fazenda?: string | null;
  id_fazenda?: number;
  id_campo?: number | null;
  status?: string;
  online?: boolean;
};

type Props = {
  dispositivo: Dispositivo;
  onSolicitarRemocao: (dispositivo: Dispositivo) => void;
};

export function DispositivoCard({ dispositivo, onSolicitarRemocao }: Props) {
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const status = dispositivo.status || (dispositivo.online ? "ON" : "OFF");
  const conectado = status === "ON" || status === "conectado";
  const StatusIcon = conectado ? Wifi : WifiOff;

  useEffect(() => {
    if (!menuAberto) return;
    const fecharAoClicarFora = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuAberto(false);
    };
    document.addEventListener("mousedown", fecharAoClicarFora);
    return () => document.removeEventListener("mousedown", fecharAoClicarFora);
  }, [menuAberto]);

  return (
    <article className="sensor-card relative flex min-h-[300px] flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="absolute right-4 top-4" ref={menuRef}>
        <button
          type="button"
          aria-label={`Ações do dispositivo ${dispositivo.nome}`}
          aria-haspopup="menu"
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto((aberto) => !aberto)}
          className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-[#1f3a2b]/40"
        >
          <Ellipsis size={19} aria-hidden="true" />
        </button>
        {menuAberto && (
          <div role="menu" className="absolute right-0 z-10 mt-1 w-48 rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuAberto(false);
                onSolicitarRemocao(dispositivo);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-50 focus:bg-red-50 focus:outline-none"
            >
              <Trash2 size={15} aria-hidden="true" />
              Remover dispositivo
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-3 pr-8">
        <h3 className="text-lg font-semibold leading-tight text-stone-900">{dispositivo.nome}</h3>
        <span className={`sensor-status-pill shrink-0 rounded-full px-3 py-1 text-xs font-medium ${conectado ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>
          <StatusIcon size={13} className="mr-1 inline" aria-hidden="true" />
          {conectado ? "Conectado" : status === "OFF" || status === "desconectado" ? "Desconectado" : "Status não informado"}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-sm text-stone-500">Leituras de umidade</p>
        <p className="sensor-reading-value mt-1 text-2xl font-semibold text-[#1f3a2b]">Não disponíveis</p>
        <p className="mt-1 text-xs text-stone-400">A integração de telemetria ainda não está configurada.</p>
      </div>

      <dl className="sensor-metadata mt-auto space-y-2 border-t border-[#efeadc] pt-4 text-sm text-stone-600">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="shrink-0 text-stone-400" aria-hidden="true" />
          <dt className="sr-only">Fazenda vinculada</dt>
          <dd>{dispositivo.fazenda || "Fazenda não informada"}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Cpu size={15} className="shrink-0 text-stone-400" aria-hidden="true" />
          <dt className="sr-only">Campo associado</dt>
          <dd>{dispositivo.id_campo ? `Campo ${dispositivo.id_campo}` : "Campo não informado"}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Cpu size={15} className="shrink-0 text-stone-400" aria-hidden="true" />
          <dt className="sr-only">MAC</dt>
          <dd>{dispositivo.mac || "MAC não informado"}</dd>
        </div>
      </dl>

    </article>
  );
}