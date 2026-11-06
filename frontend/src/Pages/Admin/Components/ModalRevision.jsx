import React, { useState } from 'react';
import { FaCheck, FaBan, FaExpand, FaCompress, FaTimes } from "react-icons/fa";

export default function ModalRevision({ socio, onClose, onDecision, procesando }) {
    const [pantallaCompleta, setPantallaCompleta] = useState(false);

    if (!socio) return null;

    // Evaluamos de forma segura si es un PDF o una Imagen
    const urlSegura = socio.constanciaUrl || "";
    const esCloudinary = urlSegura.includes("res.cloudinary.com");
    const esPdf = urlSegura.toLowerCase().endsWith(".pdf");

    return (
        <div
            id="fondo-modal-registro"
            onClick={(e) => e.target.id === "fondo-modal-registro" && onClose()}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-6 transition-all"
        >
            <div className={`bg-white flex flex-col relative shadow-2xl overflow-hidden transition-all duration-300 ${
                pantallaCompleta 
                    ? "w-full h-full rounded-none" 
                    : "w-[95vw] max-w-7xl h-[92vh] rounded-lg"
            }`}>
                
                {/* Cabecera Compacta */}
                <div className="bg-[#132A46] px-6 py-3 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-baseline gap-4">
                        <h3 className="text-xl font-bold">{socio.razonSocial}</h3>
                        <span className="text-sm text-gray-300 bg-white/10 px-2 py-1 rounded">
                            CUIT: {socio.cuit}
                        </span>
                        <span className="text-sm text-gray-300 bg-white/10 px-2 py-1 rounded capitalize">
                            {socio.categoria}
                        </span>
                        <span className="text-sm text-gray-300 bg-white/10 px-2 py-1 rounded capitalize">
                            {socio.email}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setPantallaCompleta(!pantallaCompleta)}
                            className="text-gray-300 hover:text-white transition-colors p-2"
                            title={pantallaCompleta ? "Restaurar tamaño" : "Pantalla completa"}
                        >
                            {pantallaCompleta ? <FaCompress size={18} /> : <FaExpand size={18} />}
                        </button>
                        <button onClick={onClose} className="text-gray-300 hover:text-white p-2">
                            <FaTimes size={22} />
                        </button>
                    </div>
                </div>

                {/* Área de Visualización Maximizada (Sin bordes ni márgenes innecesarios) */}
                <div className="flex-grow bg-gray-100 flex items-center justify-center overflow-hidden">
                    {!urlSegura ? (
                        <div className="text-center text-gray-400">
                            <span className="text-4xl block mb-2">⚠️</span>
                            <p className="font-bold">No se adjuntó constancia.</p>
                        </div>
                    ) : !esCloudinary ? (
                        <div className="text-center text-red-400">
                            <span className="text-4xl block mb-2">🛑</span>
                            <p className="font-bold">Archivo bloqueado o de origen desconocido.</p>
                        </div>
                    ) : esPdf ? (
                        <iframe
                            src={`${urlSegura}#toolbar=1&navpanes=0&scrollbar=1`}
                            title="Visor de Constancia"
                            className="w-full h-full border-none"
                        />
                    ) : (
                        <img
                            src={urlSegura}
                            alt={`Constancia de ${socio.razonSocial}`}
                            className="w-full h-full object-contain bg-[#e5e7eb]"
                        />
                    )}
                </div>

                {/* Pie del Modal (Acciones) */}
                <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end gap-3 shrink-0">
                    <button
                        disabled={procesando}
                        onClick={() => onDecision(socio.id, "rechazado")}
                        className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-bold rounded flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <FaBan /> Rechazar Solicitud
                    </button>
                    <button
                        disabled={procesando}
                        onClick={() => onDecision(socio.id, "aprobado")}
                        className="px-6 py-2.5 bg-[#00B859] hover:bg-[#009649] text-white font-bold rounded shadow-md flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <FaCheck /> Aprobar Socio
                    </button>
                </div>
            </div>
        </div>
    );
}