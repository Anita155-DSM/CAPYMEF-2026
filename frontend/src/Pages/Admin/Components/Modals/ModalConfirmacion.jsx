import { FaTrashAlt } from "react-icons/fa";

export default function ModalConfirmacion({ isOpen, titulo, mensaje, onConfirmar, onCancelar }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animacion-modal">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col items-center p-6 text-center relative overflow-hidden">
                
                {/* Icono de Basura Superior */}
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">
                    <FaTrashAlt />
                </div>

                {/* Título */}
                <h3 className="text-xl font-extrabold text-[#132A46] uppercase tracking-wide mb-2">
                    {titulo || "¿Estás seguro?"}
                </h3>

                {/* Mensaje Descriptivo */}
                <p className="text-gray-600 text-sm mb-8 leading-relaxed px-2">
                    {mensaje || "Esta acción no se puede deshacer."}
                </p>

                {/* Botonera */}
                <div className="flex gap-4 w-full">
                    <button 
                        type="button" 
                        onClick={onCancelar}
                        className="flex-1 bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold py-3 px-4 rounded-xl shadow transition-colors text-sm uppercase tracking-wider"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button" 
                        onClick={onConfirmar}
                        className="flex-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold py-3 px-4 rounded-xl shadow transition-colors text-sm uppercase tracking-wider"
                    >
                        Eliminar
                    </button>
                </div>

            </div>
        </div>
    );
}