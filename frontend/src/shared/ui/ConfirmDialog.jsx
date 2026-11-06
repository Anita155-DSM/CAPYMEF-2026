import { FaTrashAlt } from "react-icons/fa";

/**
 * Diálogo de confirmación (reemplaza a window.confirm).
 *   <ConfirmDialog isOpen={abierto} titulo="…" mensaje="…"
 *      textoConfirmar="Eliminar" onConfirmar={…} onCancelar={…} />
 */
export default function ConfirmDialog({
  isOpen,
  titulo = "¿Estás seguro?",
  mensaje = "Esta acción no se puede deshacer.",
  textoConfirmar = "Eliminar",
  icono: Icono = FaTrashAlt,
  onConfirmar,
  onCancelar,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs animacion-modal"
      onMouseDown={(e) => e.target === e.currentTarget && onCancelar?.()}
    >
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-600">
          <Icono />
        </div>

        <h3 className="text-lg font-bold text-navy">{titulo}</h3>
        <p className="mt-2 px-1 text-sm leading-relaxed text-slate-600">{mensaje}</p>

        <div className="mt-6 flex w-full gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="flex-1 cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-xs transition-colors hover:bg-red-700"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
