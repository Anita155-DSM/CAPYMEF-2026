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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animacion-modal">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col items-center p-6 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">
          <Icono />
        </div>

        <h3 className="text-xl font-extrabold text-navy uppercase tracking-wide mb-2">{titulo}</h3>
        <p className="text-gray-600 text-sm mb-8 leading-relaxed px-2">{mensaje}</p>

        <div className="flex gap-4 w-full">
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl shadow transition-colors text-sm uppercase tracking-wider"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="flex-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold py-3 px-4 rounded-xl shadow transition-colors text-sm uppercase tracking-wider"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
