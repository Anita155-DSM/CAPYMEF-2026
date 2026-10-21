import { Link } from "react-router-dom";
import AvisoCuotasNoDisponibles from "./AvisoCuotasNoDisponibles";
import {
  ESTILOS_ESTADO_CUOTA,
  formatearFechaCuota,
  formatearMonto,
  formatearPeriodo,
  ordenarPorPeriodo,
} from "../../utils/cuotas";

/** Últimas tres cuotas (tarjeta del Inicio). */
export default function EstadoCuenta({ cuotas }) {
  const movimientos = Array.isArray(cuotas) ? ordenarPorPeriodo(cuotas).slice(0, 3) : [];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-base font-bold uppercase tracking-wide text-gray-700">Estado de la cuenta</h2>
        <Link to="/socios/pagos" className="text-sm font-bold text-[#0875b1] hover:underline">Ver historial</Link>
      </div>
      <div>
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
              <div key={m.id} className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-0 last:pb-0 first:pt-0">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-navy first-letter:uppercase sm:text-base">Cuota de {formatearPeriodo(m.mes_anio)}</p>
                  <p className="text-xs text-gray-500">
                    {m.estado === "pagada" ? "Abonada" : `Vence el ${formatearFechaCuota(m.fecha_vencimiento)}`} · {formatearMonto(m.monto)}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-center text-xs font-bold ${estilo.clase}`}>{estilo.texto}</span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}