import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";

type Props = {
  open: boolean;
  nomeFazenda: string;
  loading: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteDialog({ open, nomeFazenda, loading, error, onCancel, onConfirm }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251b]/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && !loading && onCancel()}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-farm-title"
        aria-describedby="delete-farm-description"
        aria-busy={loading}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-700">
          <span aria-hidden="true">!</span>
        </div>
        <h2 id="delete-farm-title" className="mt-4 text-xl font-semibold text-stone-900">Excluir propriedade?</h2>
        <p id="delete-farm-description" className="mt-2 text-sm leading-6 text-stone-600">
          Confirma a exclusão de <strong className="text-stone-900">{nomeFazenda}</strong>? Ela será removida da sua lista e os dispositivos vinculados deixarão de aparecer. A ação não pode ser desfeita pela tela.
        </p>
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
        <div className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
            {loading ? "Excluindo..." : "Confirmar exclusão"}
          </button>
        </div>
      </section>
    </div>
  );
}