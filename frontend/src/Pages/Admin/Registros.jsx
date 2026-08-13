import { useState, useEffect } from "react";
import { obtenerTodosLosUsuarios } from "../../services/adminServices";
import Loading from "../../Components/Loading";

export default function RegistrosAdmin() {
    const [solicitudes, setSolicitudes] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargarSolicitudes = async () => {
            try {
                const result = await obtenerTodosLosUsuarios();

                if (result.exito) {
                    // Filtración en el Front: Solo guardamos los usuarios en estado 'pendiente'
                    const pendientes = result.data.filter(
                        (usuario) => usuario.estado === "pendiente"
                    );
                    setSolicitudes(pendientes);
                } else {
                    alert("Error: " + result.mensaje);
                }
            } catch (error) {
                console.error("Error al obtener solicitudes pendientes:", error);
            } finally {
                setCargando(false);
            }
        };

        cargarSolicitudes();
    }, []);

    if (cargando) {
        return (
            <div className="p-10 text-xl font-bold text-[#132A46]">
                <Loading />
            </div>
        );
    }

    return (
        <div className="p-8 w-full font-sans">
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
                                    <td className="py-3 px-4 text-gray-800 font-medium">
                                        {socio.razonSocial}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">{socio.cuit}</td>
                                    <td className="py-3 px-4 text-gray-600">{socio.email}</td>
                                    <td className="py-3 px-4 text-gray-600 capitalize">{socio.categoria}</td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                                            {socio.estado}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button className="bg-[#1D7BB6] hover:bg-[#132A46] text-white font-semibold py-1.5 px-4 rounded text-sm transition-colors shadow-sm">
                                            Revisar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}