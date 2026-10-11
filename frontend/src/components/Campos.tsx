import { useCallback, useEffect, useState } from "react";
import { Plus, MapPin, Ruler, LayoutGrid, Sprout } from "lucide-react";
import CampoModal from "./CampoModal";
import "../styles/fields.css";

const API_URL = "http://localhost:5000/api/campos";

type Campo = {
  id?: string;
  nome: string;
  localizacao: string;
  areaHa: number;
  cultura: string;
  talhoes: number;
  observacoes?: string;
};

const camposDemonstracao: Campo[] = [
  {
    id: "demo-f01",
    nome: "Fazenda Santa Rita",
    localizacao: "São José do Rio Preto · SP",
    areaHa: 86.5,
    cultura: "Soja",
    talhoes: 5,
    observacoes: "Monitoramento ativo de umidade nos talhões produtivos.",
  },
  {
    id: "demo-f02",
    nome: "Fazenda Vale Verde",
    localizacao: "Bauru · SP",
    areaHa: 42.8,
    cultura: "Milho",
    talhoes: 3,
    observacoes: "Irrigação acompanhada por sensores capacitivos.",
  },
  {
    id: "demo-f03",
    nome: "Estufa Experimental",
    localizacao: "Araçatuba · SP",
    areaHa: 2.4,
    cultura: "Tomate",
    talhoes: 4,
    observacoes: "Área de testes para parâmetros de cultivo controlado.",
  },
];

const formatarHa = (valor: number) =>
  `${Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ha`;

function CampoCard({ campo }: { campo: Campo }) {
  return (
    <article className="field-card flex min-h-[280px] flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-tight text-stone-900">{campo.nome}</h3>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#1f3a2b]/10 px-3 py-1 text-xs font-medium text-[#1f3a2b]">
          <Sprout size={13} />
          {campo.cultura}
        </span>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-500">
        <MapPin size={15} className="shrink-0 text-stone-400" />
        {campo.localizacao}
      </p>

      <dl className="field-metrics mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#f4f1ea] px-4 py-3">
          <dt className="flex items-center gap-1.5 text-xs text-stone-500">
            <Ruler size={13} />
            Área total
          </dt>
          <dd className="mt-1 text-xl font-semibold text-[#1f3a2b]">{formatarHa(campo.areaHa)}</dd>
        </div>
        <div className="rounded-2xl bg-[#f4f1ea] px-4 py-3">
          <dt className="flex items-center gap-1.5 text-xs text-stone-500">
            <LayoutGrid size={13} />
            Talhões
          </dt>
          <dd className="mt-1 text-xl font-semibold text-[#1f3a2b]">{campo.talhoes}</dd>
        </div>
      </dl>

      {campo.observacoes && (
        <p className="field-note mt-auto line-clamp-2 border-t border-[#efeadc] pt-4 text-sm text-stone-600">
          {campo.observacoes}
        </p>
      )}
    </article>
  );
}

function CardAdicionar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="field-add-card group flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-[#1f3a2b]/30 bg-white/40 p-6 text-[#1f3a2b] transition hover:border-[#1f3a2b] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#1f3a2b]/40 focus:ring-offset-2 focus:ring-offset-[#f4f1ea]"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1f3a2b] text-white transition group-hover:scale-105">
        <Plus size={30} />
      </span>
      <span className="text-base font-medium">Cadastrar novo campo / fazenda</span>
    </button>
  );
}

export default function Campos() {
  const [campos, setCampos] = useState<Campo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [aviso, setAviso] = useState("");
  const areaTotal = campos.reduce((total, campo) => total + campo.areaHa, 0);
  const talhoesTotal = campos.reduce((total, campo) => total + campo.talhoes, 0);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error();
        const dados = (await res.json()) as Campo[];
        if (!cancelado) setCampos(dados);
      } catch {
        if (!cancelado) {
          setCampos(camposDemonstracao);
          setAviso("Modo demonstração: propriedades de exemplo. Novos cadastros ficam apenas nesta sessão enquanto a API estiver indisponível.");
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

  async function salvarCampo(dados: Omit<Campo, "id">) {
    let novo: Campo;
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      if (!res.ok) throw new Error();
      novo = (await res.json()) as Campo;
    } catch {
      novo = { id: crypto.randomUUID(), ...dados };
      setAviso("Campo salvo apenas nesta sessão: o servidor não respondeu.");
    }

    setCampos((atuais) => [...atuais, novo]);
    setModalAberto(false);
  }

  return (
    <div className="field-page min-h-full bg-[#f4f1ea] p-6 text-stone-800 sm:p-10">
      <header className="field-page-header mb-8">
        <p className="field-eyebrow">Propriedades</p>
        <h1 className="text-3xl font-semibold text-stone-900">Meus Campos e Fazendas</h1>
        <p className="mt-1 text-stone-500">
          Cadastre suas propriedades e organize o monitoramento por área e por cultura.
        </p>
      </header>

      {aviso && (
        <div
          role="status"
          className="field-demo-notice mb-6 rounded-2xl bg-amber-50 px-5 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          {aviso}
        </div>
      )}

      {carregando ? (
        <p className="text-stone-500">Carregando campos...</p>
      ) : (
        <>
          {campos.length > 0 && (
            <div className="field-summary" aria-label="Resumo das propriedades">
              <div><span>Propriedades</span><strong>{campos.length}</strong></div>
              <div><span>Área cadastrada</span><strong>{formatarHa(areaTotal)}</strong></div>
              <div><span>Talhões</span><strong>{talhoesTotal}</strong></div>
            </div>
          )}
          <div className="field-grid grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {campos.map((c) => (
              <CampoCard key={c.id} campo={c} />
            ))}
            <CardAdicionar onClick={() => setModalAberto(true)} />
          </div>
        </>
      )}

      <CampoModal aberto={modalAberto} onFechar={fecharModal} onSalvar={salvarCampo} />
    </div>
  );
}
