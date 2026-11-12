import { Link } from "react-router-dom";
import { FaArrowRight, FaClockRotateLeft, FaReceipt } from "react-icons/fa6";
import AvisoCuotasNoDisponibles from "./AvisoCuotasNoDisponibles";
import {
  ESTILOS_ESTADO_CUOTA,
  formatearFechaCuota,
  formatearMonto,
  formatearPeriodo,
  ordenarPorPeriodo,
} from "../../utils/cuotas";

/** Últimas dos cuotas (tarjeta del Inicio, alineada en altura con Cuota Actual). */
export default function EstadoCuenta({ cuotas }) {
  const movimientos = Array.isArray(cuotas) ? ordenarPorPeriodo(cuotas).slice(0, 2) : [];

  return (
    <section className="flex h-full flex-col rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
            <FaClockRotateLeft />
          </span>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy">
            Estado de la cuenta
          </h2>
        </div>
        <Link
          to="/socios/pagos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary-dark hover:underline sm:text-sm"
        >
          Ver historial <FaArrowRight className="text-xs" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        {cuotas === undefined ? (
          <div className="rounded-xl bg-surface p-5 text-sm text-slate-500">
            Cargando movimientos...
          </div>
        ) : cuotas === null ? (
          <AvisoCuotasNoDisponibles />
        ) : movimientos.length === 0 ? (
          <div className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-surface p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg text-primary/70 shadow-2xs">
              <FaReceipt />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy">Sin movimientos registrados</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Todavía no hay cuotas ni comprobantes en el historial de tu cuenta.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {movimientos.map((m) => {
              const estilo = ESTILOS_ESTADO_CUOTA[m.estado] || ESTILOS_ESTADO_CUOTA.pendiente;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy first-letter:uppercase sm:text-[15px]">
                      Cuota de {formatearPeriodo(m.mes_anio)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {m.estado === "pagada"
                        ? "Abonada"
                        : `Vence el ${formatearFechaCuota(m.fecha_vencimiento)}`}{" "}
                      · <span className="font-semibold text-navy/80">{formatearMonto(m.monto)}</span>
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-center text-xs font-semibold ${estilo.clase}`}
                  >
                    {estilo.texto}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
