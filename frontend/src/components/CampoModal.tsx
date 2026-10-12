import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export const CULTURAS = ["Milho", "Soja", "Café", "Algodão", "Cana-de-açúcar", "Outra"];

const FORM_INICIAL = {
  nome: "",
  localizacao: "",
  areaHa: "",
  cultura: CULTURAS[0],
  culturaOutra: "",
  talhoes: "1",
  observacoes: "",
};

type FormState = {
  nome: string;
  localizacao: string;
  areaHa: string;
  cultura: string;
  culturaOutra: string;
  talhoes: string;
  observacoes: string;
};

function validar(form: FormState) {
  const erros: Record<string, string> = {};
  const area = Number(form.areaHa);
  const talhoes = Number(form.talhoes);

  if (!form.nome.trim()) erros.nome = "Informe o nome da fazenda ou do campo.";
  if (!form.localizacao.trim()) erros.localizacao = "Informe a cidade e o estado.";
  if (form.areaHa === "" || area <= 0) erros.areaHa = "Informe uma área maior que 0 ha.";
  if (form.cultura === "Outra" && !form.culturaOutra.trim())
    erros.culturaOutra = "Informe qual é a cultura.";
  if (form.talhoes === "" || !Number.isInteger(talhoes) || talhoes < 1)
    erros.talhoes = "Informe um número inteiro de 1 ou mais.";

  return erros;
}

const inputBase =
  "w-full rounded-xl border bg-[#faf8f3] px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 " +
  "focus:outline-none focus:ring-2 focus:ring-[#1f3a2b]/40";

function Campo({
  id,
  label,
  erro,
  dica,
  children,
}: {
  id: string;
  label: string;
  erro?: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-stone-700">
        {label}
      </label>
      {children}
      {erro ? (
        <p className="mt-1 text-xs text-red-600">{erro}</p>
      ) : dica ? (
        <p className="mt-1 text-xs text-stone-500">{dica}</p>
      ) : null}
    </div>
  );
}

type CampoModalProps = {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (dados: {
    nome: string;
    localizacao: string;
    areaHa: number;
    cultura: string;
    talhoes: number;
    observacoes: string;
  }) => Promise<void> | void;
};

export default function CampoModal({ aberto, onFechar, onSalvar }: CampoModalProps) {
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroSalvamento, setErroSalvamento] = useState("");
  const primeiroCampo = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setForm(FORM_INICIAL);
    setErros({});
    setSalvando(false);
    setErroSalvamento("");
    primeiroCampo.current?.focus();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", onKey);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const atualizar = (campo: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    if (erros[campo]) setErros((er) => ({ ...er, [campo]: "" }));
  };

  const borda = (campo: keyof FormState) => (erros[campo] ? "border-red-400" : "border-[#e3ddcd]");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const novosErros = validar(form);
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setSalvando(true);
    setErroSalvamento("");
    try {
      await onSalvar({
        nome: form.nome.trim(),
        localizacao: form.localizacao.trim(),
        areaHa: Number(form.areaHa),
        cultura: form.cultura === "Outra" ? form.culturaOutra.trim() : form.cultura,
        talhoes: Number(form.talhoes),
        observacoes: form.observacoes.trim(),
      });
    } catch (error) {
      setErroSalvamento(error instanceof Error ? error.message : "Não foi possível salvar a fazenda.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f3a2b]/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-campo"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="titulo-modal-campo" className="text-xl font-semibold text-stone-900">
              Novo campo ou fazenda
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Depois de cadastrar, você poderá associar sensores a esta propriedade.
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#1f3a2b]/40"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Campo id="campo-nome" label="Nome da fazenda ou campo" erro={erros.nome}>
            <input
              id="campo-nome"
              ref={primeiroCampo}
              type="text"
              value={form.nome}
              onChange={atualizar("nome")}
              placeholder="Ex: Fazenda Santa Rita"
              className={`${inputBase} ${borda("nome")}`}
            />
          </Campo>

          <Campo id="campo-local" label="Cidade - Estado" erro={erros.localizacao}>
            <input
              id="campo-local"
              type="text"
              value={form.localizacao}
              onChange={atualizar("localizacao")}
              placeholder="Ex: Araras - SP"
              className={`${inputBase} ${borda("localizacao")}`}
            />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo id="campo-area" label="Área total (ha)" erro={erros.areaHa}>
              <input
                id="campo-area"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={form.areaHa}
                onChange={atualizar("areaHa")}
                placeholder="Ex: 120"
                className={`${inputBase} ${borda("areaHa")}`}
              />
            </Campo>
            <Campo id="campo-talhoes" label="Quantidade de talhões" erro={erros.talhoes}>
              <input
                id="campo-talhoes"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={form.talhoes}
                onChange={atualizar("talhoes")}
                className={`${inputBase} ${borda("talhoes")}`}
              />
            </Campo>
          </div>

          <Campo id="campo-cultura" label="Tipo de cultura">
            <select
              id="campo-cultura"
              value={form.cultura}
              onChange={atualizar("cultura")}
              className={`${inputBase} border-[#e3ddcd]`}
            >
              {CULTURAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Campo>

          {form.cultura === "Outra" && (
            <Campo id="campo-cultura-outra" label="Qual cultura?" erro={erros.culturaOutra}>
              <input
                id="campo-cultura-outra"
                type="text"
                value={form.culturaOutra}
                onChange={atualizar("culturaOutra")}
                placeholder="Ex: Laranja"
                className={`${inputBase} ${borda("culturaOutra")}`}
              />
            </Campo>
          )}

          <Campo
            id="campo-obs"
            label="Observações (opcional)"
            dica={`${form.observacoes.length}/300 caracteres`}
          >
            <textarea
              id="campo-obs"
              rows={3}
              maxLength={300}
              value={form.observacoes}
              onChange={atualizar("observacoes")}
              placeholder="Ex: Solo argiloso, irrigação por pivô central."
              className={`${inputBase} resize-none border-[#e3ddcd]`}
            />
          </Campo>

          {erroSalvamento && <p className="text-sm text-red-700" role="alert">{erroSalvamento}</p>}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-full border border-[#e3ddcd] px-6 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-[#1f3a2b]/40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-full bg-[#1f3a2b] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#2a4d39] focus:outline-none focus:ring-2 focus:ring-[#1f3a2b]/40 focus:ring-offset-2 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar campo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
