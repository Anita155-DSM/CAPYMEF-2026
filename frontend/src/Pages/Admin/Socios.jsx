import { useState, useEffect } from "react";
import { obtenerTodosLosUsuarios } from "../../services/adminServices.js";
import Loading from "../../Components/Loading";
import Search, { useBuscador } from "./Components/Search"; 
import { toast } from "sonner";
import { FaEdit, FaUserSlash, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx"; // Importamos la librería de Excel
import ModalEditarSocio from "./Components/ModalEditarSocio.jsx";

export default function Socios() {
    const [socios, setSocios] = useState([]);
    const [cargando, setCargando] = useState(true);
    
    // Estado para controlar el modal de edición (que crearemos después)
    const [socioAEditar, setSocioAEditar] = useState(null);

    const { filtros, dispatch, filtrados, opciones } = useBuscador(socios);

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const cargarUsuarios = async () => {
        try {
            const result = await obtenerTodosLosUsuarios();
            // Filtramos para que no aparezcan los "pendientes" (esos están en Registros)
            if (result.exito) setSocios(result.data.filter(u => u.estado !== "pendiente"));
        } catch (error) {
            console.error(error);
        } finally {
            setCargando(false);
        }
    };

    // Función para Exportar a Excel
    const exportarExcel = () => {
        if (filtrados.length === 0) {
            toast.error("No hay datos para exportar");
            return;
        }

        // Armamos un array limpio solo con los datos que queremos en el Excel
        const datosParaExcel = filtrados.map(socio => ({
            "Razón Social": socio.razonSocial,
            "CUIT": socio.cuit,
            "Email": socio.email,
            "Categoría": socio.categoria,
            "Rubro": socio.rubro,
            "Localidad": socio.localidad,
            "Teléfono": socio.telefono, // Lo exportamos aunque no se vea en la tabla web
            "Estado": socio.estado
        }));

        const worksheet = XLSX.utils.json_to_sheet(datosParaExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Padrón Socios");
        
        // Descargamos el archivo
        XLSX.writeFile(workbook, "Padron_Socios_CAPYMEF.xlsx");
        toast.success("¡Archivo Excel descargado con éxito!");
    };

    // Función para suspender (borrado lógico a 'inactivo')
    const handleSuspender = async (id, razonSocial) => {
        const confirmar = window.confirm(`¿Estás seguro que deseas inactivar a ${razonSocial}? Dejará de tener acceso como socio activo.`);
        if (!confirmar) return;

        try {
            // ACA DEBES LLAMAR A TU SERVICIO DEL BACKEND
            // Ejemplo: await cambiarEstadoSocio(id, 'inactivo');
            
            // Por ahora hacemos la actualización visual en el frontend:
            setSocios(prev => prev.map(s => s.id === id ? { ...s, estado: 'inactivo' } : s));
            toast.success(`El socio ${razonSocial} fue marcado como inactivo.`);
        } catch (error) {
            toast.error("Error al intentar inactivar al socio.");
        }
    };

    if (cargando) return <div className="p-10"><Loading /></div>;

    return (
        <div className="px-4 w-full font-sans relative">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
                <div className="flex-grow w-full">
                    <Search 
                        titulo="Padrón de Socios" 
                        filtros={filtros} 
                        dispatch={dispatch} 
                        opciones={opciones} 
                    />
                </div>
                
                {/* Botón de Excel */}
                <button 
                    onClick={exportarExcel}
                    className="flex items-center gap-2 bg-[#107c41] hover:bg-[#0c5e31] text-white font-bold py-2.5 px-5 rounded-lg shadow-md transition-colors shrink-0"
                >
                    <FaFileExcel className="text-xl" />
                    Exportar a Excel
                </button>
            </div>

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
                            <th className="py-3 px-4 font-semibold text-sm text-center">Acciones</th>
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
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize shadow-sm ${
                                            socio.estado === 'aprobado' ? 'bg-green-100 text-green-700' : 
                                            socio.estado === 'inactivo' ? 'bg-red-100 text-red-700' : 
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {socio.estado}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            {/* Botón Editar */}
                                            <button 
                                                onClick={() => setSocioAEditar(socio)}
                                                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-colors shadow-sm"
                                                title="Editar datos del socio"
                                            >
                                                <FaEdit size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

           <ModalEditarSocio
           socio={socioAEditar}
           onClose={()=>setSocioAEditar(null)}
           onActualizado={cargarUsuarios}
           />
        </div>
    );
}