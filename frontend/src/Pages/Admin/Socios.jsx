import { useState, useEffect, useReducer, useMemo } from "react";
import { obtenerTodosLosUsuarios } from "../../services/adminServices";
import Loading from "../../Components/Loading";

// 1. Estado inicial de los filtros
const filtrosIniciales = {
  busqueda: "",
  categoria: "Todas",
  rubro: "Todas",
  localidad: "Todas",
};

// 2. Reducer para manejar los estados del filtrado de forma limpia
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

export default function Socios() {
  const [socios, setSocios] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // 3. Inicializamos el reducer
  const [filtros, dispatch] = useReducer(reducerFiltros, filtrosIniciales);

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
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

  // 4. Extracción dinámica de valores para que los selects se armen solos
  // Usamos filter(Boolean) para evitar que se creen opciones en blanco si un socio no completó el dato
  const categoriasUnicas = ["Todas", ...new Set(socios.map((s) => s.categoria).filter(Boolean))];
  const rubrosUnicos = ["Todas", ...new Set(socios.map((s) => s.rubro).filter(Boolean))];
  const localidadesUnicas = ["Todas", ...new Set(socios.map((s) => s.localidad).filter(Boolean))];

  // 5. Filtrado en memoria ultra rápido
  const sociosFiltrados = useMemo(() => {
    return socios.filter((socio) => {
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
  }, [socios, filtros]);

  if (cargando) {
    return <div className="p-10 text-xl font-bold text-[#132A46]"><Loading /></div>;
  }

  return (
    <div className="px-4 w-full font-sans">
      
      {/* SECCIÓN DE FILTROS (Basado en el diseño institucional) */}
      <div className="bg-[#f0f5fa] p-6 rounded-t-xl border-b-2 border-[#1D7BB6] mb-6 flex flex-col gap-4 shadow-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#132A46] tracking-wide uppercase">
            Padrón de Socios
          </h2>
          <button 
            onClick={() => dispatch({ tipo: "RESETEAR" })}
            className="text-sm text-[#1D7BB6] font-bold hover:text-[#132A46] hover:underline transition-colors"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-end gap-4 w-full">
          {/* Buscador de texto */}
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

          {/* Selectores */}
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
              <th className="py-3 px-4 font-semibold text-sm">Razón Social</th>
              <th className="py-3 px-4 font-semibold text-sm">CUIT</th>
              <th className="py-3 px-4 font-semibold text-sm">Email</th>
              <th className="py-3 px-4 font-semibold text-sm">Categoría</th>
              <th className="py-3 px-4 font-semibold text-sm">Estado</th>
              <th className="py-3 px-4 font-semibold text-sm text-center">Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {sociosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-6 text-center text-gray-500 font-medium">
                  {socios.length === 0 
                    ? "No hay usuarios registrados en la base de datos."
                    : "No se encontraron coincidencias con los filtros aplicados."}
                </td>
              </tr>
            ) : (
              sociosFiltrados.map((socio) => (
                <tr key={socio.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-800 font-medium">{socio.razonSocial}</td>
                  <td className="py-3 px-4 text-gray-600">{socio.cuit}</td>
                  <td className="py-3 px-4 text-gray-600">{socio.email}</td>
                  <td className="py-3 px-4 text-gray-600 capitalize">{socio.categoria}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${socio.estado === 'aprobado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
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