import { useEffect, useRef, useState } from "react";
import { Ellipsis, LayoutGrid, MapPin, Ruler, Sprout, Trash2 } from "lucide-react";

export type Campo = {
  id: string | number;
  nome: string;
  localizacao?: string | null;
  areaHa?: number | null;
  cultura?: string | null;
  talhoes?: number | null;
  observacoes?: string | null;
};

type Props = {
  campo: Campo;
  onSolicitarExclusao: (campo: Campo) => void;
};

const formatarHa = (valor?: number | null) =>
  valor == null
    ? "Não informado"
    : `${Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ha`;

export default function CampoCard({ campo, onSolicitarExclusao }: Props) {
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuAberto) return;
    const fecharAoClicarFora = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuAberto(false);
    };
    document.addEventListener("mousedown", fecharAoClicarFora);
    return () => document.removeEventListener("mousedown", fecharAoClicarFora);
  }, [menuAberto]);

  return (
    <article className="field-card relative flex min-h-[280px] flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="absolute right-4 top-4" ref={menuRef}>
        <button
          type="button"
          aria-label={`Ações da propriedade ${campo.nome}`}
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
                onSolicitarExclusao(campo);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-50 focus:bg-red-50 focus:outline-none"
            >
              <Trash2 size={15} aria-hidden="true" />
              Excluir propriedade
            </button>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-3 pr-8">
        <h3 className="text-lg font-semibold leading-tight text-stone-900">{campo.nome}</h3>
        <span className="inline-flex max-w-[48%] shrink-0 items-center gap-1.5 truncate rounded-full bg-[#1f3a2b]/10 px-3 py-1 text-xs font-medium text-[#1f3a2b]">
          <Sprout size={13} aria-hidden="true" />
          {campo.cultura || "Cultura não informada"}
        </span>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-500">
        <MapPin size={15} className="shrink-0 text-stone-400" aria-hidden="true" />
        {campo.localizacao || "Localização não informada"}
      </p>

      <dl className="field-metrics mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#f4f1ea] px-4 py-3">
          <dt className="flex items-center gap-1.5 text-xs text-stone-500"><Ruler size={13} aria-hidden="true" />Área total</dt>
          <dd className="mt-1 text-sm font-semibold text-[#1f3a2b]">
            {campo.areaHa == null ? <span className="field-placeholder">Não informado</span> : formatarHa(campo.areaHa)}
          </dd>
        </div>
        <div className="rounded-2xl bg-[#f4f1ea] px-4 py-3">
          <dt className="flex items-center gap-1.5 text-xs text-stone-500"><LayoutGrid size={13} aria-hidden="true" />Talhões</dt>
          <dd className="mt-1 text-xl font-semibold text-[#1f3a2b]">
            {campo.talhoes == null ? <span className="field-placeholder">Não informado</span> : campo.talhoes}
          </dd>
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