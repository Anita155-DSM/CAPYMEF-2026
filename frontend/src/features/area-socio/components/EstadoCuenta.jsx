import { Link } from "react-router-dom";
import AvisoCuotasNoDisponibles from "./AvisoCuotasNoDisponibles";
import { ESTILOS_ESTADO_CUOTA, formatearPeriodo, ordenarPorPeriodo } from "../utils/cuotas";

/** Últimas tres cuotas (tarjeta del Inicio). */
export default function EstadoCuenta({ cuotas }) {
  const movimientos = Array.isArray(cuotas) ? ordenarPorPeriodo(cuotas).slice(0, 3) : [];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
        <h2 className="text-lg font-medium uppercase text-gray-600">Estado de la cuenta</h2>
        <Link to="/socios/pagos" className="text-sm font-bold text-[#0875b1] hover:underline">Ver historial</Link>
      </div>
      <div className="space-y-1">
        {cuotas === undefined ? (
          <p className="text-sm text-gray-600">Cargando movimientos...</p>
        ) : cuotas === null ? (
          <AvisoCuotasNoDisponibles />
        ) : movimientos.length === 0 ? (
          <p className="text-sm text-gray-600">Todavía no hay movimientos en tu cuenta.</p>
        ) : (
          movimientos.map((m) => {
            const estilo = ESTILOS_ESTADO_CUOTA[m.estado] || ESTILOS_ESTADO_CUOTA.pendiente;
            return (
              <div key={m.id} className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
                <span className="text-sm first-letter:uppercase sm:text-base">Cuota de {formatearPeriodo(m.mes_anio)}</span>
                <span className={`min-w-20 px-2 py-1 text-center text-sm ${estilo.clase}`}>{estilo.texto}</span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
