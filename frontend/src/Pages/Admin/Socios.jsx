import { useState, useEffect } from "react";
import { obtenerTodosLosUsuarios } from "../../services/adminServices"; // El nuevo import
import Loading from "../../Components/Loading"

export default function Socios() {
  const [socios, setSocios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        // Llamamos a la función actualizada
        const result = await obtenerTodosLosUsuarios();

        if (result.exito) {
          setSocios(result.data);
        } else {
          alert("Error: " + result.mensaje);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };

    cargarUsuarios();
  }, []);

  if (cargando) {
    return <div className="p-10 text-xl font-bold text-[#132A46]"><Loading /></div>;
  }

  return (
    <div className="p-8 w-full font-sans">
      <h2 className="text-3xl font-bold text-[#132A46] mb-8 border-b-2 border-[#1D7BB6] pb-2 inline-block">
        Gestión de Socios
      </h2>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#132A46] text-white">
              <th className="py-3 px-4 font-semibold text-sm">Razón Social</th>
              <th className="py-3 px-4 font-semibold text-sm">CUIT</th>
              <th className="py-3 px-4 font-semibold text-sm">Email</th>
              <th className="py-3 px-4 font-semibold text-sm">Categoría</th>
              <th className="py-3 px-4 font-semibold text-sm">Estado</th>
              <th className="py-3 px-4 font-semibold text-sm text-center">Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {socios.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-6 text-center text-gray-500 font-medium">
                  No hay usuarios registrados en la base de datos.
                </td>
              </tr>
            ) : (
              socios.map((socio) => (
                <tr key={socio.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-800 font-medium">{socio.razonSocial}</td>
                  <td className="py-3 px-4 text-gray-600">{socio.cuit}</td>
                  <td className="py-3 px-4 text-gray-600">{socio.email}</td>
                  <td className="py-3 px-4 text-gray-600 capitalize">{socio.categoria}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${socio.estado === 'aprobado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {socio.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <p className="text-[#1D7BB6] hover:underline text-sm font-semibold mr-3">{socio.telefono}</p>
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