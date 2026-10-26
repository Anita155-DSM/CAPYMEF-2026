import { OPCIONES_ESTADO } from "../utils/cuotas";

const selectClase =
  "border border-gray-300 rounded px-2 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-navy cursor-pointer";

function Selector({ etiqueta, valor, opciones, onChange }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs text-gray-600 mb-1 font-semibold">{etiqueta}</label>
      <select value={valor} onChange={(e) => onChange(e.target.value)} className={`${selectClase} min-w-40`}>
        {opciones.map((op) => (
          <option key={op.valor} value={op.valor}>{op.texto}</option>
        ))}
      </select>
    </div>
  );
}

/** Buscador + filtros por período y estado. Se usa junto con useFiltrosCuotas. */
export default function FiltrosCuotas({ filtros, cambiar, limpiar, opcionesPeriodo }) {
  return (
    <div className="bg-[#f0f5fa] p-6 rounded-xl border border-primary/30 mb-6 flex flex-col gap-4 shadow-sm">
      <div className="flex justify-between items-center border-b-2 border-primary pb-2">
        <h2 className="text-3xl font-bold text-navy uppercase">Historial de pagos</h2>
        <button type="button" onClick={limpiar} className="text-sm text-primary font-bold hover:underline">
          Limpiar filtros
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end gap-4 w-full">
        <div className="grow relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por CUIT o razón social..."
            value={filtros.busqueda}
            onChange={(e) => cambiar("busqueda")(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#8da5b8] rounded text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
          />
        </div>

        <Selector etiqueta="Mes/Año" valor={filtros.periodo} opciones={opcionesPeriodo} onChange={cambiar("periodo")} />
        <Selector etiqueta="Estado" valor={filtros.estado} opciones={OPCIONES_ESTADO} onChange={cambiar("estado")} />
      </div>
    </div>
  );
}
