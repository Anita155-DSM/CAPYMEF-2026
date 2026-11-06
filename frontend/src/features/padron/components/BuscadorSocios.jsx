import { FaFilter, FaMagnifyingGlass } from "react-icons/fa6";

const selectClase =
  "w-full cursor-pointer rounded-lg border border-slate-200 bg-surface/60 px-3 py-2 text-xs font-medium text-slate-700 transition-colors focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

function FiltroSelect({ label, valor, opciones, onChange, ancho = "" }) {
  return (
    <div className={`flex w-full flex-col ${ancho}`}>
      <label className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <select value={valor} onChange={(e) => onChange(e.target.value)} className={selectClase}>
        {opciones.map((op) => (
          <option key={op} value={op} className="capitalize">
            {op}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Barra de búsqueda + filtros. Se usa junto con useBuscador. */
export default function BuscadorSocios({
  titulo = "Filtros de búsqueda",
  filtros,
  dispatch,
  opciones,
}) {
  const set = (tipo) => (payload) => dispatch({ tipo, payload });

  const hayFiltrosActivos =
    Boolean(filtros.busqueda?.trim()) ||
    filtros.categoria !== "Todas" ||
    filtros.rubro !== "Todas" ||
    filtros.localidad !== "Todas";

  return (
    <div className="rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-blue text-primary">
            <FaFilter className="text-xs" />
          </span>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-navy">{titulo}</h2>
        </div>

        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={() => dispatch({ tipo: "RESETEAR" })}
            className="cursor-pointer text-xs font-semibold text-primary transition-colors hover:text-navy hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-end">
        <div className="grow">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Búsqueda rápida
          </label>
          <div className="relative">
            <FaMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por CUIT, Razón Social o correo electrónico..."
              value={filtros.busqueda}
              onChange={(e) => set("SET_BUSQUEDA")(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-surface/60 py-2 pl-9 pr-4 text-xs text-slate-800 transition-colors placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:flex xl:gap-4">
          <FiltroSelect
            label="Categoría"
            ancho="xl:w-44"
            valor={filtros.categoria}
            opciones={opciones.categorias}
            onChange={set("SET_CATEGORIA")}
          />
          <FiltroSelect
            label="Rubro"
            ancho="xl:w-52"
            valor={filtros.rubro}
            opciones={opciones.rubros}
            onChange={set("SET_RUBRO")}
          />
          <FiltroSelect
            label="Localidad"
            ancho="xl:w-44"
            valor={filtros.localidad}
            opciones={opciones.localidades}
            onChange={set("SET_LOCALIDAD")}
          />
        </div>
      </div>
    </div>
  );
}
