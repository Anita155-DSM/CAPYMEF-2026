import { useState, useEffect, useReducer, useMemo } from "react";
import { obtenerTodosLosUsuarios, gestionarEstadoSolicitud } from "../../services/adminServices";
import Loading from "../../Components/Loading";

// ==========================================
// 1. Configuración del Reducer para Filtros
// ==========================================
const filtrosIniciales = {
    busqueda: "",
    categoria: "Todas",
    rubro: "Todas",
    localidad: "Todas",
};

const reducerFiltros = (estado, accion) => {
    switch (accion.tipo) {
        case "SET_BUSQUEDA": return { ...estado, busqueda: accion.payload };
        case "SET_CATEGORIA": return { ...estado, categoria: accion.payload };
        case "SET_RUBRO": return { ...estado, rubro: accion.payload };
        case "SET_LOCALIDAD": return { ...estado, localidad: accion.payload };
        case "RESETEAR": return filtrosIniciales;
        default: return estado;
    }
};

export default function RegistrosAdmin() {
    const [solicitudes, setSolicitudes] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Estados de los Filtros
    const [filtros, dispatch] = useReducer(reducerFiltros, filtrosIniciales);

    // Estados para el Modal
    const [socioSeleccionado, setSocioSeleccionado] = useState(null);
    const [procesando, setProcesando] = useState(false);

    useEffect(() => {
        cargarSolicitudes();
    }, []);

    const cargarSolicitudes = async () => {
        try {
            const result = await obtenerTodosLosUsuarios();
            if (result.exito) {
                const pendientes = result.data.filter(
                    (usuario) => usuario.estado === "pendiente"
                );
                setSolicitudes(pendientes);
            }
        } catch (error) {
            console.error("Error al obtener solicitudes:", error);
        } finally {
            setCargando(false);
        }
    };

    // Función que se ejecuta al hacer clic en Aprobar o Rechazar
    const handleDecision = async (id, decision) => {
        setProcesando(true);
        try {
            const result = await gestionarEstadoSolicitud(id, decision);

            if (result.exito) {
                // Tip: Acá a futuro podés cambiar estos alert() por toast.success() de Sonner 😉
                alert(`¡Solicitud ${decision} con éxito!`);
                
                // Actualizamos la tabla en vivo
                setSolicitudes((prev) => prev.filter((socio) => socio.id !== id));
                setSocioSeleccionado(null);
            } else {
                alert("Error: " + result.mensaje);
            }
        } catch (error) {
            alert("Hubo un error al procesar la solicitud.");
        } finally {
            setProcesando(false);
        }
    };

    // ==========================================
    // 2. Lógica dinámica de Filtros
    // ==========================================
    
    // Extracción de opciones únicas para los selects (basado en las solicitudes pendientes)
    const categoriasUnicas = ["Todas", ...new Set(solicitudes.map((s) => s.categoria).filter(Boolean))];
    const rubrosUnicos = ["Todas", ...new Set(solicitudes.map((s) => s.rubro).filter(Boolean))];
    const localidadesUnicas = ["Todas", ...new Set(solicitudes.map((s) => s.localidad).filter(Boolean))];

    // Filtrado en memoria
    const solicitudesFiltradas = useMemo(() => {
        return solicitudes.filter((socio) => {
            const termino = filtros.busqueda.toLowerCase();
            const coincideBusqueda =
                (socio.cuit && socio.cuit.toLowerCase().includes(termino)) ||
                (socio.razonSocial && socio.razonSocial.toLowerCase().includes(termino)) ||
                (socio.titular && socio.titular.toLowerCase().includes(termino));

            const coincideCategoria = filtros.categoria === "Todas" || socio.categoria === filtros.categoria;
            const coincideRubro = filtros.rubro === "Todas" || socio.rubro === filtros.rubro;
            const coincideLocalidad = filtros.localidad === "Todas" || socio.localidad === filtros.localidad;

            return coincideBusqueda && coincideCategoria && coincideRubro && coincideLocalidad;
        });
    }, [solicitudes, filtros]);

    if (cargando) {
        return (
            <div className="p-10 text-xl font-bold text-[#132A46]">
                <Loading />
            </div>
        );
    }

    return (
        <div className="px-4 w-full font-sans relative">
            
            {/* SECCIÓN DE FILTROS */}
            <div className="bg-[#f0f5fa] p-6 rounded-xl border border-[#1D7BB6]/30 mb-8 flex flex-col gap-4 shadow-sm">
                <div className="flex justify-between items-center border-b-2 border-[#1D7BB6] pb-2">
                    <h2 className="text-3xl font-bold text-[#132A46]">
                        Solicitudes de Registro Pendientes
                    </h2>
                    <button 
                        onClick={() => dispatch({ tipo: "RESETEAR" })}
                        className="text-sm text-[#1D7BB6] font-bold hover:text-[#132A46] hover:underline transition-colors"
                    >
                        Limpiar filtros
                    </button>
                </div>

                <div className="flex flex-col xl:flex-row xl:items-end gap-4 w-full mt-2">
                    <div className="flex-grow">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por CUIT, Razón Social o Titular..."
                                value={filtros.busqueda}
                                onChange={(e) => dispatch({ tipo: "SET_BUSQUEDA", payload: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-[#8da5b8] rounded text-sm focus:outline-none focus:border-[#132A46] focus:ring-1 focus:ring-[#132A46]"
                            />
                        </div>
                    </div>

                    <div className="w-full xl:w-48 flex flex-col">
                        <label className="text-xs text-gray-600 mb-1 font-semibold">Categoría</label>
                        <select
                            value={filtros.categoria}
                            onChange={(e) => dispatch({ tipo: "SET_CATEGORIA", payload: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-[#132A46] cursor-pointer"
                        >
                            {categoriasUnicas.map((cat, index) => (
                                <option key={index} value={cat} className="capitalize">{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full xl:w-56 flex flex-col">
                        <label className="text-xs text-gray-600 mb-1 font-semibold">Rubro/Actividad</label>
                        <select
                            value={filtros.rubro}
                            onChange={(e) => dispatch({ tipo: "SET_RUBRO", payload: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-[#132A46] cursor-pointer"
                        >
                            {rubrosUnicos.map((rubro, index) => (
                                <option key={index} value={rubro}>{rubro}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full xl:w-48 flex flex-col">
                        <label className="text-xs text-gray-600 mb-1 font-semibold">Localidad</label>
                        <select
                            value={filtros.localidad}
                            onChange={(e) => dispatch({ tipo: "SET_LOCALIDAD", payload: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-[#132A46] cursor-pointer"
                        >
                            {localidadesUnicas.map((loc, index) => (
                                <option key={index} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* TABLA DE RESULTADOS */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#132A46] text-white">
                            <th className="py-3 px-4 font-semibold text-sm">Razón Social / Nombre</th>
                            <th className="py-3 px-4 font-semibold text-sm">CUIT</th>
                            <th className="py-3 px-4 font-semibold text-sm">Email</th>
                            <th className="py-3 px-4 font-semibold text-sm">Categoría</th>
                            <th className="py-3 px-4 font-semibold text-sm">Estado</th>
                            <th className="py-3 px-4 font-semibold text-sm text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {solicitudesFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-6 text-center text-gray-500 font-medium">
                                    {solicitudes.length === 0 
                                        ? "No hay solicitudes pendientes de revisión en este momento." 
                                        : "No se encontraron solicitudes con los filtros aplicados."}
                                </td>
                            </tr>
                        ) : (
                            solicitudesFiltradas.map((socio) => (
                                <tr key={socio.id} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 text-gray-800 font-medium">{socio.razonSocial}</td>
                                    <td className="py-3 px-4 text-gray-600">{socio.cuit}</td>
                                    <td className="py-3 px-4 text-gray-600">{socio.email}</td>
                                    <td className="py-3 px-4 text-gray-600 capitalize">{socio.categoria}</td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                                            {socio.estado}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => setSocioSeleccionado(socio)}
                                            className="bg-[#1D7BB6] hover:bg-[#132A46] text-white font-semibold py-1.5 px-4 rounded text-sm transition-colors shadow-sm"
                                        >
                                            Revisar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ========================================================= */}
            {/* MODAL DE REVISIÓN CON VISOR DE DOCUMENTO                  */}
            {/* ========================================================= */}
            {socioSeleccionado && (
                <div
                    id="fondo-modal-registro"
                    onClick={(e) => e.target.id === "fondo-modal-registro" && setSocioSeleccionado(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all"
                >
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative animacion-modal">

                        {/* Cabecera del Modal */}
                        <div className="bg-[#132A46] p-4 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">Revisión de Socio: {socioSeleccionado.razonSocial}</h3>
                                <p className="text-sm text-gray-300">CUIT: {socioSeleccionado.cuit} | Categoría: <span className="capitalize">{socioSeleccionado.categoria}</span></p>
                            </div>
                            <button
                                onClick={() => setSocioSeleccionado(null)}
                                className="text-gray-300 hover:text-white text-2xl font-bold"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Cuerpo del Modal: Visor del Documento */}
                        <div className="p-4 flex-grow bg-gray-100 overflow-hidden flex flex-col h-[60vh]">
                            <p className="font-semibold text-gray-700 mb-2">Constancia de Inscripción (AFIP):</p>

                            <div className="w-full flex-grow bg-white border border-gray-300 rounded-lg overflow-hidden shadow-inner">
                                {socioSeleccionado.constanciaUrl ? (
                                    socioSeleccionado.constanciaUrl.startsWith("https://res.cloudinary.com/") ? (
                                        <iframe
                                            src={socioSeleccionado.constanciaUrl}
                                            title="Visor de Constancia"
                                            className="w-full h-full object-contain"
                                            sandbox="allow-same-origin allow-scripts"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full flex-col text-gray-400 p-6 text-center">
                                            <span className="text-4xl mb-2">🛑</span>
                                            <p className="text-red-500 font-bold mb-1">Bloqueado por seguridad</p>
                                            <p className="text-sm">La URL del documento no proviene de un servidor seguro autorizado.</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex items-center justify-center h-full flex-col text-gray-400">
                                        <span className="text-4xl mb-2">⚠️</span>
                                        <p className="text-gray-500 font-bold">No se adjuntó constancia en el registro.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pie del Modal: Botones de Decisión */}
                        <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-4">
                            <button
                                disabled={procesando}
                                onClick={() => handleDecision(socioSeleccionado.id, "rechazado")}
                                className="px-6 py-2 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                                Rechazar
                            </button>

                            <button
                                disabled={procesando}
                                onClick={() => handleDecision(socioSeleccionado.id, "aprobado")}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-colors disabled:opacity-50"
                            >
                                Aprobar Socio
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}