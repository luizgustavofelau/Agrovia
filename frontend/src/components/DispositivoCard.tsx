import { useEffect, useRef, useState } from "react";
import { Cpu, Droplets, Ellipsis, KeyRound, MapPin, Trash2, Wifi, WifiOff } from "lucide-react";
import { listarLeituras, type LeituraUmidade } from "../services/dispositivos.api";

export type Dispositivo = {
  id: string | number;
  nome: string;
  mac?: string;
  fazenda?: string | null;
  id_fazenda?: number;
  id_campo?: number | null;
  status?: string;
  online?: boolean;
  ultimaUmidade?: number | null;
  ultimaAtualizacao?: string | null;
  chaveConfigurada?: boolean;
};

type Props = {
  dispositivo: Dispositivo;
  onSolicitarRemocao: (dispositivo: Dispositivo) => void;
  onIrrigar?: (dispositivo: Dispositivo) => void;
  onGerarChave?: (dispositivo: Dispositivo) => void;
};

const formatarQuando = (iso?: string | null) => {
  if (!iso) return "";
  const segundos = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (segundos < 60) return "agora há pouco";
  if (segundos < 3600) return `há ${Math.round(segundos / 60)} min`;
  if (segundos < 86400) return `há ${Math.round(segundos / 3600)} h`;
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

// Minigráfico das últimas leituras (0–100 %), desenhado em SVG sem biblioteca.
function Sparkline({ leituras }: { leituras: LeituraUmidade[] }) {
  if (leituras.length < 2) return null;
  const w = 220;
  const h = 44;
  const pontos = leituras.map((l, i) => [
    (i / (leituras.length - 1)) * w,
    h - 3 - (Math.min(Math.max(l.umidade, 0), 100) / 100) * (h - 6),
  ]);
  const linha = pontos.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg className="sensor-sparkline mt-3 w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img"
      aria-label={`Últimas ${leituras.length} leituras de umidade`}>
      <polygon points={`0,${h} ${linha} ${w},${h}`} className="sensor-sparkline-area" />
      <polyline points={linha} className="sensor-sparkline-line" />
    </svg>
  );
}

export function DispositivoCard({ dispositivo, onSolicitarRemocao, onIrrigar, onGerarChave }: Props) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [leituras, setLeituras] = useState<LeituraUmidade[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const status = dispositivo.status || (dispositivo.online ? "ON" : "OFF");
  const conectado = status === "ON" || status === "conectado";
  const StatusIcon = conectado ? Wifi : WifiOff;
  const temLeitura = dispositivo.ultimaUmidade !== null && dispositivo.ultimaUmidade !== undefined;

  useEffect(() => {
    if (!menuAberto) return;
    const fecharAoClicarFora = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuAberto(false);
    };
    document.addEventListener("mousedown", fecharAoClicarFora);
    return () => document.removeEventListener("mousedown", fecharAoClicarFora);
  }, [menuAberto]);

  // Recarrega o histórico só quando chega uma leitura nova.
  useEffect(() => {
    if (!temLeitura) return undefined;
    let cancelado = false;
    listarLeituras(dispositivo.id, 24)
      .then((dados) => { if (!cancelado) setLeituras(dados); })
      .catch(() => { if (!cancelado) setLeituras([]); });
    return () => { cancelado = true; };
  }, [dispositivo.id, dispositivo.ultimaAtualizacao, temLeitura]);

  const itemMenu = "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition focus:outline-none";

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
          <div role="menu" className="absolute right-0 z-10 mt-1 w-56 rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
            {onGerarChave && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuAberto(false);
                  onGerarChave(dispositivo);
                }}
                className={`${itemMenu} text-stone-700 hover:bg-stone-50 focus:bg-stone-50`}
              >
                <KeyRound size={15} aria-hidden="true" />
                {dispositivo.chaveConfigurada ? "Gerar nova chave" : "Gerar chave do dispositivo"}
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuAberto(false);
                onSolicitarRemocao(dispositivo);
              }}
              className={`${itemMenu} text-red-700 hover:bg-red-50 focus:bg-red-50`}
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
        <p className="text-sm text-stone-500">Umidade do solo</p>
        {temLeitura ? (
          <>
            <p className="sensor-reading-value mt-1 text-2xl font-semibold text-[#1f3a2b]">
              {Number(dispositivo.ultimaUmidade).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
            </p>
            <p className="mt-1 text-xs text-stone-400">Última leitura {formatarQuando(dispositivo.ultimaAtualizacao)}</p>
            <Sparkline leituras={leituras} />
          </>
        ) : (
          <>
            <p className="sensor-reading-value mt-1 text-2xl font-semibold text-[#1f3a2b]">Não disponíveis</p>
            <p className="mt-1 text-xs text-stone-400">
              {dispositivo.chaveConfigurada
                ? "Chave configurada. Aguardando a primeira leitura do aparelho."
                : "Gere a chave do dispositivo no menu ⋯ e grave-a no ESP32 para receber leituras."}
            </p>
          </>
        )}
      </div>

      {onIrrigar && (
        <button
          type="button"
          onClick={() => onIrrigar(dispositivo)}
          className="sensor-irrigate-btn mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1f3a2b]/40 focus:ring-offset-2"
        >
          <Droplets size={15} aria-hidden="true" />
          Irrigação
        </button>
      )}

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
