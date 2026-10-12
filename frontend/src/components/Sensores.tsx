import { useEffect, useState } from "react";
import { Cpu, MapPin, Wifi, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";
import "../styles/sensors.css";

const API_URL = "/api/dispositivos";

type Dispositivo = {
  id: string | number;
  nome: string;
  mac?: string;
  fazenda?: string | null;
  id_fazenda?: number;
  id_campo?: number | null;
  status?: string;
  online?: boolean;
};

function DeviceCard({ device }: { device: Dispositivo }) {
  const status = device.status || (device.online ? "ON" : "OFF");
  const connected = status === "ON";
  const StatusIcon = connected ? Wifi : WifiOff;

  return (
    <article className="sensor-card flex min-h-[300px] flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-tight text-stone-900">{device.nome}</h3>
        <span className={`sensor-status-pill shrink-0 rounded-full px-3 py-1 text-xs font-medium ${connected ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>
          <StatusIcon size={13} className="mr-1 inline" aria-hidden="true" />
          {connected ? "Conectado" : status === "OFF" ? "Desconectado" : "Status não informado"}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-sm text-stone-500">Leituras de umidade</p>
        <p className="sensor-reading-value mt-1 text-2xl font-semibold text-[#1f3a2b]">Não disponíveis</p>
        <p className="mt-1 text-xs text-stone-400">A integração de telemetria ainda não está configurada.</p>
      </div>

      <dl className="sensor-metadata mt-auto space-y-2 border-t border-[#efeadc] pt-4 text-sm text-stone-600">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="shrink-0 text-stone-400" />
          <dt className="sr-only">Fazenda vinculada</dt>
          <dd>{device.fazenda || "Fazenda não informada"}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Cpu size={15} className="shrink-0 text-stone-400" />
          <dt className="sr-only">Campo associado</dt>
          <dd>{device.id_campo ? `Campo ${device.id_campo}` : "Campo não informado"}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Cpu size={15} className="shrink-0 text-stone-400" />
          <dt className="sr-only">MAC</dt>
          <dd>{device.mac || "MAC não informado"}</dd>
        </div>
      </dl>
    </article>
  );
}

export default function Sensores() {
  const idUsuario = localStorage.getItem("usuarioId");
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [dadosDemonstracao, setDadosDemonstracao] = useState(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      if (!idUsuario) {
        setErro("Não foi possível identificar a conta. Saia e entre novamente.");
        setCarregando(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}?id_usuario=${encodeURIComponent(idUsuario)}`);
        if (!res.ok) throw new Error();
        const dados = (await res.json()) as Dispositivo[];
        if (!cancelado) {
          setDispositivos(dados);
          setDadosDemonstracao(res.headers.get("X-Data-Source") === "demo");
        }
      } catch {
        if (!cancelado) setErro("Não foi possível carregar os dispositivos. Verifique a API e tente novamente.");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [idUsuario]);

  return (
    <div className="sensor-page min-h-full bg-[#f4f1ea] p-6 text-stone-800 sm:p-10">
      <header className="sensor-page-header mb-8">
        <p className="sensor-eyebrow">Telemetria</p>
        <h1 className="text-3xl font-semibold text-stone-900">Dispositivos e sensores</h1>
        <p className="mt-1 text-stone-500">
          Consulte dispositivos vinculados. Leituras dependem de integração de telemetria.
        </p>
      </header>

      {dadosDemonstracao && (
        <div
          role="status"
          className="sensor-demo-notice mb-6 rounded-2xl bg-amber-50 px-5 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          Modo demonstração: estes cadastros são exemplos da API e não estão persistidos no MySQL.
        </div>
      )}
      {erro && <p className="mb-5 text-sm text-red-700" role="alert">{erro}</p>}

      {carregando ? (
        <p className="text-stone-500">Carregando dispositivos...</p>
      ) : (
        <>
          {dispositivos.length > 0 && (
            <div className="sensor-summary" aria-label="Resumo dos dispositivos">
              <div><span>Dispositivos registrados</span><strong>{dispositivos.length}</strong></div>
              <div><span>Conectados</span><strong>{dispositivos.filter((item) => item.status === "ON" || item.online).length}</strong></div>
              <div><span>Leituras de umidade</span><strong className="sensor-summary-unavailable">Não disponíveis</strong></div>
            </div>
          )}
          <div className="sensor-grid grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {dispositivos.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
            {!erro && dispositivos.length === 0 && <p className="sensor-empty-state" role="status">Nenhum dispositivo registrado. Cadastre um dispositivo na área da Conta.</p>}
            <Link className="sensor-account-link" to="/conta?aba=dispositivos">
              <span aria-hidden="true"><Cpu size={22} /></span>
              <strong>Gerenciar dispositivos</strong>
              <small>Abrir cadastro na área da Conta</small>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
