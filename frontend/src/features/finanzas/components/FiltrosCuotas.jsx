import { FaFilter, FaMagnifyingGlass } from "react-icons/fa6";
import { OPCIONES_CATEGORIA_CUOTA, OPCIONES_ESTADO } from "../utils/cuotas";

const selectClase =
  "rounded-xl border border-slate-200 bg-surface/60 px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-colors sm:text-sm";

function Selector({ etiqueta, valor, opciones, onChange }) {
  return (
    <div className="flex w-full flex-col xl:w-auto">
      <label className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {etiqueta}
      </label>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className={`${selectClase} w-full xl:min-w-44`}
      >
        {opciones.map((op) => (
          <option key={op.valor} value={op.valor}>
            {op.texto}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Buscador + filtros por período, categoría y estado. Se usa junto con useFiltrosCuotas. */
export default function FiltrosCuotas({ filtros, cambiar, limpiar, opcionesPeriodo }) {
  const hayFiltrosActivos =
    filtros.busqueda.trim() !== "" ||
    filtros.periodo !== "todos" ||
    filtros.categoria !== "todas" ||
    filtros.estado !== "todos";

  return (
    <section className="rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-xs text-primary">
            <FaFilter />
          </span>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-navy sm:text-sm">
            Filtros de búsqueda
          </h2>
        </div>

        <button
          type="button"
          onClick={limpiar}
          disabled={!hayFiltrosActivos}
          className="cursor-pointer text-xs font-semibold text-primary transition-colors hover:text-navy disabled:cursor-default disabled:text-slate-300"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-end">
        <div className="grow">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Socio o CUIT
          </label>
          <div className="relative">
            <FaMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por CUIT, razón social o correo electrónico..."
              value={filtros.busqueda}
              onChange={(e) => cambiar("busqueda")(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-surface/60 py-2.5 pl-9 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:flex xl:gap-4">
          <Selector
            etiqueta="Mes / Año"
            valor={filtros.periodo}
            opciones={opcionesPeriodo}
            onChange={cambiar("periodo")}
          />
          <Selector
            etiqueta="Categoría"
            valor={filtros.categoria}
            opciones={OPCIONES_CATEGORIA_CUOTA}
            onChange={cambiar("categoria")}
          />
          <Selector
            etiqueta="Estado"
            valor={filtros.estado}
            opciones={OPCIONES_ESTADO}
            onChange={cambiar("estado")}
          />
        </div>
      </div>
    </section>
  );
}
