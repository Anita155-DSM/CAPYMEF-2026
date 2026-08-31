import React, { useState } from 'react';

export default function ModalRevision({ socio, onClose, onDecision, procesando }) {
    // Estado para manejar el modo Pantalla Completa
    const [pantallaCompleta, setPantallaCompleta] = useState(false);

    if (!socio) return null;

    return (
        <div
            id="fondo-modal-registro"
            onClick={(e) => e.target.id === "fondo-modal-registro" && onClose()}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all"
        >
            <div className={`bg-white shadow-2xl flex flex-col relative animacion-modal overflow-hidden transition-all duration-300 ${
                pantallaCompleta 
                // Modo Pantalla Completa: Ocupa el 100% sin bordes redondeados
                ? "w-full h-full rounded-none" 
                // Modo Normal: Más grande por defecto (max-w-6xl) y con 'resize' para agrandar a medida
                : "w-full max-w-6xl h-[85vh] rounded-xl resize" 
            }`}>
                
                {/* Cabecera del Modal (Usamos shrink-0 para que no se aplaste al redimensionar) */}
                <div className="bg-[#132A46] p-4 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-bold">Revisión de Socio: {socio.razonSocial}</h3>
                        <p className="text-sm text-gray-300">
                            CUIT: {socio.cuit} | Categoría: <span className="capitalize">{socio.categoria}</span>
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-5">
                        {/* Botón de Maximizar / Restaurar */}
                        <button 
                            onClick={() => setPantallaCompleta(!pantallaCompleta)}
                            className="text-gray-300 hover:text-white transition-colors"
                            title={pantallaCompleta ? "Restaurar tamaño" : "Pantalla completa"}
                        >
                            {pantallaCompleta ? (
                                // Ícono de Achicar
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9L4 4m0 0v5m0-5h5m11 11l-5-5m0 0v-5m0 5h-5" /></svg>
                            ) : (
                                // Ícono de Agrandar
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                            )}
                        </button>

                        <button onClick={onClose} className="text-gray-300 hover:text-white text-3xl font-bold leading-none">
                            &times;
                        </button>
                    </div>
                </div>

                {/* Cuerpo del Modal: Visor del Documento */}
                <div className="flex-grow bg-gray-100 flex flex-col h-full overflow-hidden">
                    
                    <div className="w-full flex-grow bg-white border border-gray-300 rounded-lg overflow-hidden shadow-inner flex items-center justify-center h-full">
                        {socio.constanciaUrl ? (
                            socio.constanciaUrl.startsWith("https://res.cloudinary.com/") ? (
                                
                                socio.constanciaUrl.toLowerCase().endsWith(".pdf") ? (
                                    <iframe
                                        src={socio.constanciaUrl}
                                        title="Visor de Constancia"
                                        className="w-full h-full"
                                    />
                                ) : (
                                    <img
                                        src={socio.constanciaUrl}
                                        alt={`Constancia de ${socio.razonSocial}`}
                                        className="w-full h-full object-contain p-2"
                                    />
                                )

                            ) : (
                                <div className="flex items-center justify-center h-full flex-col text-gray-400 p-6 text-center">
                                    <span className="text-4xl mb-2">🛑</span>
                                    <p className="text-red-500 font-bold mb-1">Bloqueado por seguridad</p>
                                </div>
                            )
                        ) : (
                            <div className="flex items-center justify-center h-full flex-col text-gray-400">
                                <span className="text-4xl mb-2">⚠️</span>
                                <p className="text-gray-500 font-bold">No se adjuntó constancia.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pie del Modal (shrink-0) */}
                <div className="py-2 pr-2 bg-white border-t border-gray-200 flex justify-end gap-4 shrink-0">
                    <button
                        disabled={procesando}
                        onClick={() => onDecision(socio.id, "rechazado")}
                        className="px-6 py-2 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                        Rechazar
                    </button>
                    <button
                        disabled={procesando}
                        onClick={() => onDecision(socio.id, "aprobado")}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-colors disabled:opacity-50"
                    >
                        Aprobar Socio
                    </button>
                </div>
            </div>
        </div>
    );
}