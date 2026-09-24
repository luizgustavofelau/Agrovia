import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export const MODELOS = [
  "Sensor de umidade do solo capacitivo",
  "Sensor de umidade do solo resistivo",
];

const FORM_INICIAL = {
  nome: "",
  modelo: MODELOS[0],
  localizacao: "",
  umidadeMin: "30",
  umidadeMax: "70",
  profundidade: "20",
};

function validar(form) {
  const erros = {};
  const min = Number(form.umidadeMin);
  const max = Number(form.umidadeMax);
  const prof = Number(form.profundidade);

  if (!form.nome.trim()) erros.nome = "Informe um nome para identificar o sensor.";
  if (!form.localizacao.trim()) erros.localizacao = "Informe o talhão ou a área onde ele está.";

  if (form.umidadeMin === "" || min < 0 || min > 100)
    erros.umidadeMin = "Use um valor entre 0 e 100.";
  if (form.umidadeMax === "" || max < 0 || max > 100)
    erros.umidadeMax = "Use um valor entre 0 e 100.";
  if (!erros.umidadeMin && !erros.umidadeMax && min >= max)
    erros.umidadeMax = "A umidade máxima precisa ser maior que a mínima.";

  if (form.profundidade === "" || prof <= 0)
    erros.profundidade = "Informe uma profundidade maior que 0 cm.";

  return erros;
}

const inputBase =
  "w-full rounded-xl border bg-[#faf8f3] px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 " +
  "focus:outline-none focus:ring-2 focus:ring-[#1f3a2b]/40";

function Campo({ id, label, erro, dica, children }) {
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

export default function SensorModal({ aberto, onFechar, onSalvar }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const primeiroCampo = useRef(null);

  // Reinicia o formulário sempre que o modal abre e foca no primeiro campo.
  useEffect(() => {
    if (!aberto) return;
    setForm(FORM_INICIAL);
    setErros({});
    setSalvando(false);
    primeiroCampo.current?.focus();
  }, [aberto]);

  // Fecha com Esc e trava o scroll da página enquanto o modal está aberto.
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", onKey);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const atualizar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    if (erros[campo]) setErros((er) => ({ ...er, [campo]: undefined }));
  };

  const borda = (campo) => (erros[campo] ? "border-red-400" : "border-[#e3ddcd]");

  async function handleSubmit(e) {
    e.preventDefault();
    const novosErros = validar(form);
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setSalvando(true);
    await onSalvar({
      nome: form.nome.trim(),
      modelo: form.modelo,
      localizacao: form.localizacao.trim(),
      umidadeMin: Number(form.umidadeMin),
      umidadeMax: Number(form.umidadeMax),
      profundidade: Number(form.profundidade),
    });
    setSalvando(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f3a2b]/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-sensor"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="titulo-modal-sensor" className="text-xl font-semibold text-stone-900">
              Novo sensor de umidade
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Os limites de umidade definem quando o Agrovia deve te alertar.
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
          <Campo id="sensor-nome" label="Nome do sensor" erro={erros.nome}>
            <input
              id="sensor-nome"
              ref={primeiroCampo}
              type="text"
              value={form.nome}
              onChange={atualizar("nome")}
              placeholder="Ex: Sensor Talhão 1"
              className={`${inputBase} ${borda("nome")}`}
            />
          </Campo>

          <Campo id="sensor-modelo" label="Modelo">
            <select
              id="sensor-modelo"
              value={form.modelo}
              onChange={atualizar("modelo")}
              className={`${inputBase} border-[#e3ddcd]`}
            >
              {MODELOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Campo>

          <Campo id="sensor-local" label="Talhão ou localização" erro={erros.localizacao}>
            <input
              id="sensor-local"
              type="text"
              value={form.localizacao}
              onChange={atualizar("localizacao")}
              placeholder="Ex: Talhão 1 - Milho"
              className={`${inputBase} ${borda("localizacao")}`}
            />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo id="sensor-min" label="Umidade mínima ideal (%)" erro={erros.umidadeMin}>
              <input
                id="sensor-min"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                value={form.umidadeMin}
                onChange={atualizar("umidadeMin")}
                className={`${inputBase} ${borda("umidadeMin")}`}
              />
            </Campo>
            <Campo id="sensor-max" label="Umidade máxima ideal (%)" erro={erros.umidadeMax}>
              <input
                id="sensor-max"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                value={form.umidadeMax}
                onChange={atualizar("umidadeMax")}
                className={`${inputBase} ${borda("umidadeMax")}`}
              />
            </Campo>
          </div>

          <Campo
            id="sensor-prof"
            label="Profundidade de instalação (cm)"
            erro={erros.profundidade}
          >
            <input
              id="sensor-prof"
              type="number"
              inputMode="decimal"
              min="1"
              value={form.profundidade}
              onChange={atualizar("profundidade")}
              className={`${inputBase} ${borda("profundidade")}`}
            />
          </Campo>

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
              {salvando ? "Salvando..." : "Salvar sensor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
