import { FaCreditCard, FaDownload } from "react-icons/fa6";
import {
  ESTILOS_ESTADO_CUOTA,
  formatearFechaCuota,
  formatearMonto,
  formatearPeriodo,
} from "../../utils/cuotas";

const columnas = ["Período", "Monto", "Vencimiento", "Estado", "Fecha de pago"];

/** Historial de cuotas. `procesando`, `onPagar` y `onDescargar` vienen de useAccionesCuota. */
export default function TablaCuotas({ cuotas, procesando, onPagar, onDescargar }) {
  return (
    <div className="overflow-x-auto rounded-none border border-slate-100">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200/80 bg-surface text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {columnas.map((c) => (
              <th key={c} className="px-4 py-3">
                {c}
              </th>
            ))}
            <th className="px-4 py-3 text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cuotas.map((cuota) => {
            const estilo = ESTILOS_ESTADO_CUOTA[cuota.estado] || ESTILOS_ESTADO_CUOTA.pendiente;
            const pagada = cuota.estado === "pagada";
            return (
              <tr key={cuota.id} className="transition-colors hover:bg-surface-blue/35">
                <td className="px-4 py-3.5 font-semibold text-navy first-letter:uppercase">
                  {formatearPeriodo(cuota.mes_anio)}
                </td>
                <td className="px-4 py-3.5 font-semibold text-navy tabular-nums">
                  {formatearMonto(cuota.monto)}
                </td>
                <td className="px-4 py-3.5 text-slate-600 tabular-nums">
                  {formatearFechaCuota(cuota.fecha_vencimiento)}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-block min-w-20 rounded-full px-2.5 py-1 text-center text-xs font-semibold ${estilo.clase}`}
                  >
                    {estilo.texto}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-600 tabular-nums">
                  {pagada ? formatearFechaCuota(cuota.pago?.fechaPago) : "-"}
                </td>
                <td className="px-4 py-3.5 text-right">
                  {pagada ? (
                    <button
                      type="button"
                      disabled={Boolean(procesando)}
                      onClick={() => onDescargar(cuota)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy shadow-2xs transition-colors hover:border-primary/30 hover:bg-surface-blue hover:text-primary disabled:opacity-60"
                    >
                      {procesando === `comprobante-${cuota.id}` ? "Descargando..." : "Comprobante"}{" "}
                      <FaDownload className="text-xs" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={Boolean(procesando)}
                      onClick={() => onPagar(cuota)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-primary-dark disabled:opacity-60"
                    >
                      Pagar <FaCreditCard className="text-xs" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
