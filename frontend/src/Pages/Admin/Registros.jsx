import { useState, useEffect } from "react";
import { obtenerTodosLosUsuarios, gestionarEstadoSolicitud } from "../../services/adminServices";
import Loading from "../../Components/Loading";
import ModalRevision from "./Components/ModalRevision";
import Search, { useBuscador } from "./Components/Search";

export default function RegistrosAdmin() {
    const [solicitudes, setSolicitudes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [socioSeleccionado, setSocioSeleccionado] = useState(null);
    const [procesando, setProcesando] = useState(false);

    // Conectamos nuestra propia lógica de búsqueda
    const { filtros, dispatch, filtrados, opciones } = useBuscador(solicitudes);

    useEffect(() => {
        cargarSolicitudes();
    }, []);

    const cargarSolicitudes = async () => {
        try {
            const result = await obtenerTodosLosUsuarios();
            if (result.exito) {
                setSolicitudes(result.data.filter((u) => u.estado === "pendiente"));
            }
        } catch (error) {
            console.error("Error al cargar solicitudes:", error);
        } finally {
            setCargando(false);
        }
    };

    const handleDecision = async (id, decision) => {
        setProcesando(true);
        try {
            const result = await gestionarEstadoSolicitud(id, decision);
            if (result.exito) {
                alert(`¡Solicitud ${decision} con éxito!`);
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

    if (cargando) return <div className="p-10 text-xl font-bold text-[#132A46]"><Loading /></div>;

    return (
        <div className="px-4 w-full font-sans relative">

            <Search
                titulo="Solicitudes de Registro Pendientes"
                filtros={filtros}
                dispatch={dispatch}
                opciones={opciones}
            />

            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#132A46] text-white">
                            <th className="py-3 px-4 font-semibold text-sm">Razón Social</th>
                            <th className="py-3 px-4 font-semibold text-sm">CUIT</th>
                            <th className="py-3 px-4 font-semibold text-sm">Email</th>
                            <th className="py-3 px-4 font-semibold text-sm">Categoría</th>
                            <th className="py-3 px-4 font-semibold text-sm">Rubro</th>
                            <th className="py-3 px-4 font-semibold text-sm">Localidad</th>
                            <th className="py-3 px-4 font-semibold text-sm">Teléfono</th>
                            <th className="py-3 px-4 font-semibold text-sm text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="py-6 text-center text-gray-500 font-medium">
                                    {solicitudes.length === 0
                                        ? "No hay solicitudes pendientes de revisión en este momento."
                                        : "No se encontraron solicitudes con los filtros aplicados."}
                                </td>
                            </tr>
                        ) : (
                            filtrados.map((socio) => (
                                <tr key={socio.id} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 text-gray-800 font-medium">{socio.razonSocial}</td>
                                    <td className="py-3 px-4 text-gray-600">{socio.cuit}</td>
                                    <td className="py-3 px-4 text-gray-600">{socio.email}</td>
                                    <td className="py-3 px-4 text-gray-600 capitalize">{socio.categoria}</td>
                                    <td className="py-3 px-4 text-gray-600">{socio.rubro}</td>
                                    <td className="py-3 px-4 text-gray-600">{socio.localidad}</td>
                                    <td className="py-3 px-4">
                                        <p className="text-[#1D7BB6] hover:underline text-sm font-semibold cursor-pointer">
                                            {socio.telefono}
                                        </p>
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

            <ModalRevision
                socio={socioSeleccionado}
                onClose={() => setSocioSeleccionado(null)}
                onDecision={handleDecision}
                procesando={procesando}
            />
        </div>
    );
}