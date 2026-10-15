const selectClase =
  "w-full border border-gray-300 rounded px-2 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-navy cursor-pointer";

function FiltroSelect({ label, valor, opciones, onChange, ancho }) {
  return (
    <div className={`w-full ${ancho} flex flex-col`}>
      <label className="text-xs text-gray-600 mb-1 font-semibold">{label}</label>
      <select value={valor} onChange={(e) => onChange(e.target.value)} className={selectClase}>
        {opciones.map((op) => (
          <option key={op} value={op} className="capitalize">{op}</option>
        ))}
      </select>
    </div>
  );
}

/** Barra de búsqueda + filtros. Se usa junto con useBuscador. */
export default function BuscadorSocios({ titulo, filtros, dispatch, opciones }) {
  const set = (tipo) => (payload) => dispatch({ tipo, payload });

  return (
    <div className="bg-[#f0f5fa] p-6 rounded-xl border border-primary/30 mb-8 flex flex-col gap-4 shadow-sm">
      <div className="flex justify-between items-center border-b-2 border-primary pb-2">
        <h2 className="text-3xl font-bold text-navy uppercase">{titulo}</h2>
        <button onClick={() => dispatch({ tipo: "RESETEAR" })} className="text-sm text-primary font-bold hover:underline">
          Limpiar filtros
        </button>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-end gap-4 w-full mt-2">
        <div className="flex-grow relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por CUIT, Razón Social o Titular..."
            value={filtros.busqueda}
            onChange={(e) => set("SET_BUSQUEDA")(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#8da5b8] rounded text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
          />
        </div>

        <FiltroSelect label="Categoría" ancho="xl:w-48" valor={filtros.categoria} opciones={opciones.categorias} onChange={set("SET_CATEGORIA")} />
        <FiltroSelect label="Rubro" ancho="xl:w-56" valor={filtros.rubro} opciones={opciones.rubros} onChange={set("SET_RUBRO")} />
        <FiltroSelect label="Localidad" ancho="xl:w-48" valor={filtros.localidad} opciones={opciones.localidades} onChange={set("SET_LOCALIDAD")} />
      </div>
    </div>
  );
}
