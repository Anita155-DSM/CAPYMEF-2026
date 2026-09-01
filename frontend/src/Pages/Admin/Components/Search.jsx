import { useReducer, useMemo } from "react";

const filtrosIniciales = { busqueda: "", categoria: "Todas", rubro: "Todas", localidad: "Todas" };

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

// ==========================================
// 1. EL HOOK: Tu propia librería de filtrado
// ==========================================
export function useBuscador(listaOriginal) {
    const [filtros, dispatch] = useReducer(reducerFiltros, filtrosIniciales);

    const opciones = {
        categorias: ["Todas", ...new Set(listaOriginal.map(s => s.categoria).filter(Boolean))],
        rubros: ["Todas", ...new Set(listaOriginal.map(s => s.rubro).filter(Boolean))],
        localidades: ["Todas", ...new Set(listaOriginal.map(s => s.localidad).filter(Boolean))]
    };

    const filtrados = useMemo(() => {
        return listaOriginal.filter((socio) => {
            const termino = filtros.busqueda.toLowerCase();
            const coincideBusqueda = (socio.cuit?.toLowerCase().includes(termino)) ||
                (socio.razonSocial?.toLowerCase().includes(termino)) ||
                (socio.titular?.toLowerCase().includes(termino));

            const coincideCategoria = filtros.categoria === "Todas" || socio.categoria === filtros.categoria;
            const coincideRubro = filtros.rubro === "Todas" || socio.rubro === filtros.rubro;
            const coincideLocalidad = filtros.localidad === "Todas" || socio.localidad === filtros.localidad;

            return coincideBusqueda && coincideCategoria && coincideRubro && coincideLocalidad;
        });
    }, [listaOriginal, filtros]);

    return { filtros, dispatch, filtrados, opciones };
}

// ==========================================
// 2. LA INTERFAZ: El buscador reutilizable
// ==========================================
export default function Search({ titulo, filtros, dispatch, opciones }) {
    return (
        <div className="bg-[#f0f5fa] p-6 rounded-xl border border-[#1D7BB6]/30 mb-8 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center border-b-2 border-[#1D7BB6] pb-2">
                <h2 className="text-3xl font-bold text-[#132A46] uppercase">{titulo}</h2>
                <button onClick={() => dispatch({ tipo: "RESETEAR" })} className="text-sm text-[#1D7BB6] font-bold hover:underline">
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
                        {opciones.categorias.map((cat, i) => <option key={i} value={cat} className="capitalize">{cat}</option>)}
                    </select>
                </div>

                <div className="w-full xl:w-56 flex flex-col">
                    <label className="text-xs text-gray-600 mb-1 font-semibold">Rubro</label>
                    <select
                        value={filtros.rubro}
                        onChange={(e) => dispatch({ tipo: "SET_RUBRO", payload: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-[#132A46] cursor-pointer"
                    >
                        {opciones.rubros.map((rubro, i) => <option key={i} value={rubro}>{rubro}</option>)}
                    </select>
                </div>

                <div className="w-full xl:w-48 flex flex-col">
                    <label className="text-xs text-gray-600 mb-1 font-semibold">Localidad</label>
                    <select
                        value={filtros.localidad}
                        onChange={(e) => dispatch({ tipo: "SET_LOCALIDAD", payload: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-[#132A46] cursor-pointer"
                    >
                        {opciones.localidades.map((loc, i) => <option key={i} value={loc}>{loc}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}