import { FaTimes } from "react-icons/fa";

/**
 * Marco común de los modales de formulario: fondo oscuro, tarjeta,
 * cabecera azul con título y botón de cerrar.
 *   <ModalShell titulo="Editar socio" onClose={cerrar} ancho="max-w-2xl">…</ModalShell>
 */
export default function ModalShell({ titulo, onClose, ancho = "max-w-3xl", children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animacion-modal">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${ancho} max-h-[90vh] flex flex-col overflow-hidden relative`}>
        <div className="bg-navy p-4 text-white flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold">{titulo}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-gray-300 hover:text-white text-xl transition-colors"
          >
            <FaTimes />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
