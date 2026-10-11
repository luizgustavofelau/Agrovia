import { useCallback, useEffect, useState } from "react";
import { Plus, Layers, MapPin, Cpu } from "lucide-react";
import SensorModal from "./SensorModal";
import "../styles/sensors.css";

const API_URL = "http://localhost:5000/api/sensores";

type Sensor = {
  id?: string;
  nome: string;
  modelo: string;
  localizacao: string;
  umidadeMin: number;
  umidadeMax: number;
  profundidade: number;
  ultimaLeitura?: number | null;
  ultimaLeituraEm?: string | null;
};

const sensoresDemonstracao: Sensor[] = [
  {
    id: "demo-s01",
    nome: "Sensor S-01 · Talhão Norte",
    modelo: "Capacitivo v2 · ESP32",
    localizacao: "Fazenda Santa Rita · Talhão 1",
    umidadeMin: 40,
    umidadeMax: 65,
    profundidade: 20,
    ultimaLeitura: 54,
    ultimaLeituraEm: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-s02",
    nome: "Sensor S-02 · Talhão Leste",
    modelo: "Capacitivo v2 · ESP32",
    localizacao: "Fazenda Santa Rita · Talhão 2",
    umidadeMin: 35,
    umidadeMax: 60,
    profundidade: 25,
    ultimaLeitura: 29,
    ultimaLeituraEm: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-s03",
    nome: "Sensor S-03 · Talhão Sul",
    modelo: "Capacitivo v2 · ESP32",
    localizacao: "Fazenda Santa Rita · Talhão 3",
    umidadeMin: 42,
    umidadeMax: 68,
    profundidade: 30,
    ultimaLeitura: null,
    ultimaLeituraEm: null,
  },
];

function statusDoSensor(s: Sensor) {
  if (s.ultimaLeitura == null)
    return { rotulo: "Aguardando leitura", classe: "bg-stone-100 text-stone-600" };
  if (s.ultimaLeitura < s.umidadeMin)
    return { rotulo: "Solo seco", classe: "bg-amber-100 text-amber-800" };
  if (s.ultimaLeitura > s.umidadeMax)
    return { rotulo: "Solo encharcado", classe: "bg-sky-100 text-sky-800" };
  return { rotulo: "Umidade ideal", classe: "bg-emerald-100 text-emerald-800" };
}

function BarraUmidade({ sensor }: { sensor: Sensor }) {
  const { umidadeMin, umidadeMax, ultimaLeitura } = sensor;
  const temLeitura = ultimaLeitura != null;
  const posicao = temLeitura ? Math.min(100, Math.max(0, ultimaLeitura)) : 0;

  return (
    <div>
      <div className="sensor-meter-track relative h-2.5 rounded-full bg-[#ece7da]">
        <div
          className="sensor-ideal-band absolute top-0 h-full rounded-full bg-[#1f3a2b]/25"
          style={{ left: `${umidadeMin}%`, width: `${umidadeMax - umidadeMin}%` }}
        />
        {temLeitura && (
          <div
            className="sensor-reading-point absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#1f3a2b] shadow"
            style={{ left: `${posicao}%` }}
          />
        )}
      </div>
      <p className="mt-2 text-xs text-stone-500">
        Faixa ideal: {umidadeMin}% a {umidadeMax}%
      </p>
    </div>
  );
}

function SensorCard({ sensor }: { sensor: Sensor }) {
  const status = statusDoSensor(sensor);
  const temLeitura = sensor.ultimaLeitura != null;

  return (
    <article className="sensor-card flex min-h-[300px] flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-tight text-stone-900">{sensor.nome}</h3>
        <span className={`sensor-status-pill shrink-0 rounded-full px-3 py-1 text-xs font-medium ${status.classe}`}>
          {status.rotulo}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-sm text-stone-500">Última leitura de umidade</p>
        <p className="sensor-reading-value mt-1 text-4xl font-semibold text-[#1f3a2b]">
          {temLeitura ? `${sensor.ultimaLeitura}%` : "--"}
        </p>
        {sensor.ultimaLeituraEm && (
          <p className="mt-1 text-xs text-stone-400">
            {new Date(sensor.ultimaLeituraEm).toLocaleString("pt-BR")}
          </p>
        )}
      </div>

      <div className="mt-5">
        <BarraUmidade sensor={sensor} />
      </div>

      <dl className="sensor-metadata mt-auto space-y-2 border-t border-[#efeadc] pt-4 text-sm text-stone-600">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="shrink-0 text-stone-400" />
          <dt className="sr-only">Localização</dt>
          <dd>{sensor.localizacao}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Layers size={15} className="shrink-0 text-stone-400" />
          <dt className="sr-only">Profundidade</dt>
          <dd>{sensor.profundidade} cm de profundidade</dd>
        </div>
        <div className="flex items-center gap-2">
          <Cpu size={15} className="shrink-0 text-stone-400" />
          <dt className="sr-only">Modelo</dt>
          <dd>{sensor.modelo}</dd>
        </div>
      </dl>
    </article>
  );
}

function CardAdicionar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="sensor-add-card group flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-[#1f3a2b]/30 bg-white/40 p-6 text-[#1f3a2b] transition hover:border-[#1f3a2b] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#1f3a2b]/40 focus:ring-offset-2 focus:ring-offset-[#f4f1ea]"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1f3a2b] text-white transition group-hover:scale-105">
        <Plus size={30} />
      </span>
      <span className="text-base font-medium">Adicionar novo sensor</span>
    </button>
  );
}

export default function Sensores() {
  const [sensores, setSensores] = useState<Sensor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [aviso, setAviso] = useState("");
  const sensoresComLeitura = sensores.filter((sensor) => sensor.ultimaLeitura != null);
  const umidadeMedia = sensoresComLeitura.length
    ? Math.round(
        sensoresComLeitura.reduce((total, sensor) => total + (sensor.ultimaLeitura || 0), 0) /
          sensoresComLeitura.length,
      )
    : null;

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error();
        const dados = (await res.json()) as Sensor[];
        if (!cancelado) setSensores(dados);
      } catch {
        if (!cancelado) {
          setSensores(sensoresDemonstracao);
          setAviso("Modo demonstração: leituras de exemplo. Novos sensores ficam apenas nesta sessão enquanto a API estiver indisponível.");
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const fecharModal = useCallback(() => setModalAberto(false), []);

  async function salvarSensor(dados: Omit<Sensor, "id" | "ultimaLeitura" | "ultimaLeituraEm">) {
    let novo: Sensor;
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      if (!res.ok) throw new Error();
      novo = (await res.json()) as Sensor;
    } catch {
      novo = { id: crypto.randomUUID(), ultimaLeitura: null, ultimaLeituraEm: null, ...dados };
      setAviso("Sensor salvo apenas nesta sessão: o servidor não respondeu.");
    }

    setSensores((atuais) => [...atuais, novo]);
    setModalAberto(false);
  }

  return (
    <div className="sensor-page min-h-full bg-[#f4f1ea] p-6 text-stone-800 sm:p-10">
      <header className="sensor-page-header mb-8">
        <p className="sensor-eyebrow">Telemetria</p>
        <h1 className="text-3xl font-semibold text-stone-900">Sensores</h1>
        <p className="mt-1 text-stone-500">
          Acompanhe a umidade do solo em cada talhão e cadastre novos sensores.
        </p>
      </header>

      {aviso && (
        <div
          role="status"
          className="sensor-demo-notice mb-6 rounded-2xl bg-amber-50 px-5 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          {aviso}
        </div>
      )}

      {carregando ? (
        <p className="text-stone-500">Carregando sensores...</p>
      ) : (
        <>
          {sensores.length > 0 && (
            <div className="sensor-summary" aria-label="Resumo dos sensores">
              <div><span>Dispositivos</span><strong>{sensores.length}</strong></div>
              <div><span>Leituras recebidas</span><strong>{sensoresComLeitura.length}</strong></div>
              <div><span>Umidade média</span><strong>{umidadeMedia == null ? "--" : `${umidadeMedia}%`}</strong></div>
            </div>
          )}
          <div className="sensor-grid grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {sensores.map((s) => (
              <SensorCard key={s.id} sensor={s} />
            ))}
            <CardAdicionar onClick={() => setModalAberto(true)} />
          </div>
        </>
      )}

      <SensorModal aberto={modalAberto} onFechar={fecharModal} onSalvar={salvarSensor} />
    </div>
  );
}
