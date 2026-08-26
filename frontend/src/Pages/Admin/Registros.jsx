import { useState, useEffect } from "react";
// Asegurate de importar la nueva función que creamos en el Paso 1
import { obtenerTodosLosUsuarios, gestionarEstadoSolicitud } from "../../services/adminServices";
import Loading from "../../Components/Loading";

export default function RegistrosAdmin() {
    const [solicitudes, setSolicitudes] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Estados para el Modal
    const [socioSeleccionado, setSocioSeleccionado] = useState(null);
    const [procesando, setProcesando] = useState(false); // Para deshabilitar botones mientras carga

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
                alert(`¡Solicitud ${decision} con éxito!`);
                // Actualizamos la tabla en vivo sacando al usuario que ya procesamos
                setSolicitudes((prev) => prev.filter((socio) => socio.id !== id));
                // Cerramos el modal
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

    if (cargando) {
        return (
            <div className="p-10 text-xl font-bold text-[#132A46]">
                <Loading />
            </div>
        );
    }

    return (
        <div className="p-8 w-full font-sans relative">
            <h2 className="text-3xl font-bold text-[#132A46] mb-8 border-b-2 border-[#1D7BB6] pb-2 inline-block">
                Solicitudes de Registro Pendientes
            </h2>

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
                        {solicitudes.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-6 text-center text-gray-500 font-medium">
                                    No hay solicitudes pendientes de revisión en este momento.
                                </td>
                            </tr>
                        ) : (
                            solicitudes.map((socio) => (
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
                                        {/* AL HACER CLIC, ABRIMOS EL MODAL PASÁNDOLE ESTE SOCIO */}
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
                        {/* Cuerpo del Modal: Visor del Documento */}
                        <div className="p-4 flex-grow bg-gray-100 overflow-hidden flex flex-col h-[60vh]">
                            <p className="font-semibold text-gray-700 mb-2">Constancia de Inscripción (AFIP):</p>

                            <div className="w-full flex-grow bg-white border border-gray-300 rounded-lg overflow-hidden shadow-inner">

                                {socioSeleccionado.constanciaUrl ? (
                                    // VALIDACIÓN DE SEGURIDAD: Comprobamos que el link sea estrictamente de tu nube
                                    socioSeleccionado.constanciaUrl.startsWith("https://res.cloudinary.com/") ? (
                                        <iframe
                                            src={socioSeleccionado.constanciaUrl}
                                            title="Visor de Constancia"
                                            className="w-full h-full object-contain"
                                            // EL SANDBOX: Bloquea descargas automáticas, pop-ups y ejecución de scripts maliciosos
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