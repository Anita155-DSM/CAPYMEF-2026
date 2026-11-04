import { FaCreditCard, FaDownload } from "react-icons/fa6";
import { ESTILOS_ESTADO_CUOTA, formatearFechaCuota, formatearMonto, formatearPeriodo } from "../../utils/cuotas";

const columnas = ["Período", "Monto", "Vencimiento", "Estado", "Fecha de pago"];

/** Historial de cuotas. `procesando`, `onPagar` y `onDescargar` vienen de useAccionesCuota. */
export default function TablaCuotas({ cuotas, procesando, onPagar, onDescargar }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-500">
            {columnas.map((c) => <th key={c} className="py-3 pr-3">{c}</th>)}
            <th className="py-3 text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          {cuotas.map((cuota) => {
            const estilo = ESTILOS_ESTADO_CUOTA[cuota.estado] || ESTILOS_ESTADO_CUOTA.pendiente;
            const pagada = cuota.estado === "pagada";
            return (
              <tr key={cuota.id} className="border-b border-gray-100 transition-colors hover:bg-surface/50">
                <td className="py-3.5 pr-3 font-semibold text-navy first-letter:uppercase">{formatearPeriodo(cuota.mes_anio)}</td>
                <td className="py-3.5 pr-3 font-bold text-navy">{formatearMonto(cuota.monto)}</td>
                <td className="py-3.5 pr-3 text-gray-600">{formatearFechaCuota(cuota.fecha_vencimiento)}</td>
                <td className="py-3.5 pr-3">
                  <span className={`inline-block min-w-20 rounded-full px-2.5 py-1 text-center text-xs font-bold ${estilo.clase}`}>
                    {estilo.texto}
                  </span>
                </td>
                <td className="py-3.5 pr-3 text-gray-600">{pagada ? formatearFechaCuota(cuota.pago?.fechaPago) : "-"}</td>
                <td className="py-3.5 text-right">
                  {pagada ? (
                    <button
                      type="button"
                      disabled={Boolean(procesando)}
                      onClick={() => onDescargar(cuota)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-surface-blue hover:text-primary disabled:opacity-60 cursor-pointer shadow-2xs"
                    >
                      {procesando === `comprobante-${cuota.id}` ? "Descargando..." : "Comprobante"} <FaDownload className="text-xs" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={Boolean(procesando)}
                      onClick={() => onPagar(cuota)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60 cursor-pointer shadow-2xs"
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
