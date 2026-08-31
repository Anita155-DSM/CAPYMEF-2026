import { useState, useEffect } from "react";
import { obtenerTodosLosUsuarios } from "../../services/adminServices.js";
import Loading from "../../Components/Loading";
import Search, { useBuscador } from "./Components/Search"; 

export default function Socios() {
    const [socios, setSocios] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Conectamos nuestra propia lógica de búsqueda
    const { filtros, dispatch, filtrados, opciones } = useBuscador(socios);

    useEffect(() => {
        const cargarUsuarios = async () => {
            try {
                const result = await obtenerTodosLosUsuarios();
                if (result.exito) setSocios(result.data);
            } catch (error) {
                console.error(error);
            } finally {
                setCargando(false);
            }
        };
        cargarUsuarios();
    }, []);

    if (cargando) return <div className="p-10"><Loading /></div>;

    return (
        <div className="px-4 w-full font-sans relative">
            
            <Search 
                titulo="Padrón de Socios" 
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
                            <th className="py-3 px-4 font-semibold text-sm">Estado</th>
                            <th className="py-3 px-4 font-semibold text-sm text-center">Teléfono</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="py-6 text-center text-gray-500 font-medium">
                                    {socios.length === 0 
                                        ? "No hay usuarios registrados en la base de datos."
                                        : "No se encontraron coincidencias con los filtros aplicados."}
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
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                                            socio.estado === 'aprobado' ? 'bg-green-100 text-green-700' : 
                                            socio.estado === 'rechazado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {socio.estado}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <p className="text-[#1D7BB6] hover:underline text-sm font-semibold">{socio.telefono}</p>
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