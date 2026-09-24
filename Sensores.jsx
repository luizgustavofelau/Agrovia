import { useCallback, useEffect, useState } from "react";
import { Plus, Layers, MapPin, Cpu } from "lucide-react";
import SensorModal from "./SensorModal";

// Ajuste para a URL do seu backend Node.js.
// Contrato esperado:
//   GET  /api/sensores  -> [{ id, nome, modelo, localizacao, umidadeMin, umidadeMax,
//                            profundidade, ultimaLeitura, ultimaLeituraEm }]
//   POST /api/sensores  -> recebe { nome, modelo, localizacao, umidadeMin, umidadeMax,
//                            profundidade } e devolve o sensor criado (com id).
const API_URL = "http://localhost:3333/api/sensores";

function statusDoSensor(s) {
  if (s.ultimaLeitura == null)
    return { rotulo: "Aguardando leitura", classe: "bg-stone-100 text-stone-600" };
  if (s.ultimaLeitura < s.umidadeMin)
    return { rotulo: "Solo seco", classe: "bg-amber-100 text-amber-800" };
  if (s.ultimaLeitura > s.umidadeMax)
    return { rotulo: "Solo encharcado", classe: "bg-sky-100 text-sky-800" };
  return { rotulo: "Umidade ideal", classe: "bg-emerald-100 text-emerald-800" };
}

// Barra que mostra a faixa ideal (verde) e onde a última leitura caiu (marcador).
function BarraUmidade({ sensor }) {
  const { umidadeMin, umidadeMax, ultimaLeitura } = sensor;
  const temLeitura = ultimaLeitura != null;
  const posicao = temLeitura ? Math.min(100, Math.max(0, ultimaLeitura)) : 0;

  return (
    <div>
      <div className="relative h-2.5 rounded-full bg-[#ece7da]">
        <div
          className="absolute top-0 h-full rounded-full bg-[#1f3a2b]/25"
          style={{ left: `${umidadeMin}%`, width: `${umidadeMax - umidadeMin}%` }}
        />
        {temLeitura && (
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#1f3a2b] shadow"
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

function SensorCard({ sensor }) {
  const status = statusDoSensor(sensor);
  const temLeitura = sensor.ultimaLeitura != null;

  return (
    <article className="flex min-h-[300px] flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-tight text-stone-900">{sensor.nome}</h3>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${status.classe}`}>
          {status.rotulo}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-sm text-stone-500">Última leitura de umidade</p>
        <p className="mt-1 text-4xl font-semibold text-[#1f3a2b]">
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

      <dl className="mt-auto space-y-2 border-t border-[#efeadc] pt-4 text-sm text-stone-600">
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

function CardAdicionar({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-[#1f3a2b]/30 bg-white/40 p-6 text-[#1f3a2b] transition hover:border-[#1f3a2b] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#1f3a2b]/40 focus:ring-offset-2 focus:ring-offset-[#f4f1ea]"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1f3a2b] text-white transition group-hover:scale-105">
        <Plus size={30} />
      </span>
      <span className="text-base font-medium">Adicionar novo sensor</span>
    </button>
  );
}

export default function Sensores() {
  const [sensores, setSensores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [aviso, setAviso] = useState("");

  // Carrega os sensores já cadastrados. Se o backend não responder,
  // a tela continua funcionando com estado local.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error();
        const dados = await res.json();
        if (!cancelado) setSensores(dados);
      } catch {
        if (!cancelado)
          setAviso("Não foi possível conectar ao servidor. Os sensores ficam salvos só nesta sessão.");
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const fecharModal = useCallback(() => setModalAberto(false), []);

  async function salvarSensor(dados) {
    let novo;
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      if (!res.ok) throw new Error();
      novo = await res.json();
    } catch {
      // Sem backend: guarda só no estado local, sem leitura ainda.
      novo = { id: crypto.randomUUID(), ultimaLeitura: null, ultimaLeituraEm: null, ...dados };
      setAviso("Sensor salvo apenas nesta sessão: o servidor não respondeu.");
    }

    // O novo card entra no fim da lista e o card "+" continua depois dele.
    setSensores((atuais) => [...atuais, novo]);
    setModalAberto(false);
  }

  return (
    <div className="min-h-full bg-[#f4f1ea] p-6 text-stone-800 sm:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-900">Sensores</h1>
        <p className="mt-1 text-stone-500">
          Acompanhe a umidade do solo em cada talhão e cadastre novos sensores.
        </p>
      </header>

      {aviso && (
        <div
          role="status"
          className="mb-6 rounded-2xl bg-amber-50 px-5 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          {aviso}
        </div>
      )}

      {carregando ? (
        <p className="text-stone-500">Carregando sensores...</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {sensores.map((s) => (
            <SensorCard key={s.id} sensor={s} />
          ))}
          <CardAdicionar onClick={() => setModalAberto(true)} />
        </div>
      )}

      <SensorModal aberto={modalAberto} onFechar={fecharModal} onSalvar={salvarSensor} />
    </div>
  );
}
