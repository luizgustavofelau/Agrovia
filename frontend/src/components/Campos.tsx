import { useEffect, useState } from "react";
import { Plus, MapPin, Ruler, LayoutGrid, Sprout } from "lucide-react";
import CampoModal from "./CampoModal";
import "../styles/fields.css";

const API_URL = "/api/fazendas";

type Campo = {
  id: string | number;
  nome: string;
  localizacao?: string | null;
  areaHa?: number | null;
  cultura?: string | null;
  talhoes?: number | null;
  observacoes?: string | null;
};

const formatarHa = (valor?: number | null) =>
  valor == null ? "Não informado" : `${Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ha`;

function CampoCard({ campo }: { campo: Campo }) {
  return (
    <article className="field-card flex min-h-[280px] flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-tight text-stone-900">{campo.nome}</h3>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#1f3a2b]/10 px-3 py-1 text-xs font-medium text-[#1f3a2b]">
          <Sprout size={13} />
          {campo.cultura || "Cultura não informada"}
        </span>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-500">
        <MapPin size={15} className="shrink-0 text-stone-400" />
        {campo.localizacao || "Localização não informada"}
      </p>

      <dl className="field-metrics mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#f4f1ea] px-4 py-3">
          <dt className="flex items-center gap-1.5 text-xs text-stone-500">
            <Ruler size={13} />
            Área total
          </dt>
          <dd className="mt-1 text-sm font-semibold text-[#1f3a2b]">{formatarHa(campo.areaHa)}</dd>
        </div>
        <div className="rounded-2xl bg-[#f4f1ea] px-4 py-3">
          <dt className="flex items-center gap-1.5 text-xs text-stone-500">
            <LayoutGrid size={13} />
            Talhões
          </dt>
          <dd className="mt-1 text-xl font-semibold text-[#1f3a2b]">{campo.talhoes ?? "Não informado"}</dd>
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
  const idUsuario = localStorage.getItem("usuarioId");
  const [campos, setCampos] = useState<Campo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");
  const [dadosDemonstracao, setDadosDemonstracao] = useState(false);
  const areaTotal = campos.reduce((total, campo) => total + (campo.areaHa || 0), 0);
  const areaKnownCount = campos.filter((campo) => campo.areaHa != null).length;
  const talhoesTotal = campos.reduce((total, campo) => total + (campo.talhoes || 0), 0);
  const talhoesKnownCount = campos.filter((campo) => campo.talhoes != null).length;

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
        const dados = (await res.json()) as Campo[];
        if (!cancelado) {
          setCampos(dados);
          setDadosDemonstracao(res.headers.get("X-Data-Source") === "demo");
        }
      } catch (error) {
        if (!cancelado) {
          setErro("Não foi possível carregar as fazendas. Verifique a API e tente novamente.");
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [idUsuario]);

  async function salvarCampo(dados: Omit<Campo, "id">) {
    if (!idUsuario) throw new Error("Faça login novamente antes de cadastrar uma fazenda.");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_fazenda: dados.nome,
          localizacao: dados.localizacao,
          id_usuario: Number(idUsuario),
          cultura: dados.cultura,
          area_ha: dados.areaHa,
          qtd_talhoes: dados.talhoes,
          observacoes: dados.observacoes,
        }),
      });
      const resultado = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resultado.mensagem || "Não foi possível salvar a fazenda.");
      setCampos((atuais) => [...atuais, resultado as Campo]);
      const demonstracao = res.headers.get("X-Data-Source") === "demo";
      setDadosDemonstracao(demonstracao);
      setAviso(demonstracao
        ? "Registro criado em modo demonstração; os dados ficam na memória do servidor e não são gravados no MySQL."
        : "Fazenda salva no banco de dados.");
      setModalAberto(false);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível salvar a fazenda.");
      throw error;
    }
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

      {dadosDemonstracao && (
        <div
          role="status"
          className="field-demo-notice mb-6 rounded-2xl bg-amber-50 px-5 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          Modo demonstração: a API não conseguiu acessar o MySQL; alterações não são persistidas após reiniciar o servidor.
        </div>
      )}
      {aviso && <p className="mb-5 text-sm text-emerald-800" role="status">{aviso}</p>}
      {erro && <p className="mb-5 text-sm text-red-700" role="alert">{erro}</p>}

      {carregando ? (
        <p className="text-stone-500">Carregando campos...</p>
      ) : (
        <>
          {campos.length > 0 && (
            <div className="field-summary" aria-label="Resumo das propriedades">
              <div><span>Propriedades</span><strong>{campos.length}</strong></div>
              <div><span>Área informada</span><strong>{areaKnownCount ? formatarHa(areaTotal) : "Não informada"}</strong></div>
              <div><span>Talhões informados</span><strong>{talhoesKnownCount ? talhoesTotal : "Não informado"}</strong></div>
            </div>
          )}
          {!carregando && !erro && campos.length === 0 && (
            <p className="field-empty-state" role="status">Nenhuma fazenda cadastrada. Cadastre a primeira para organizar o monitoramento.</p>
          )}
          <div className="field-grid grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {campos.map((c) => (
              <CampoCard key={c.id} campo={c} />
            ))}
            <CardAdicionar onClick={() => setModalAberto(true)} />
          </div>
        </>
      )}

      <CampoModal aberto={modalAberto} onFechar={() => setModalAberto(false)} onSalvar={salvarCampo} />
    </div>
  );
}
