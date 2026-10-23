import { FaCreditCard, FaDownload } from "react-icons/fa6";
import { ESTILOS_ESTADO_CUOTA, formatearFechaCuota, formatearMonto, formatearPeriodo } from "../../utils/cuotas";

const columnas = ["Período", "Monto", "Vencimiento", "Estado", "Fecha de pago"];

/** Historial de cuotas. `procesando`, `onPagar` y `onDescargar` vienen de useAccionesCuota. */
export default function TablaCuotas({ cuotas, procesando, onPagar, onDescargar }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="text-xs uppercase text-[#66727d]">
            {columnas.map((c) => <th key={c} className="py-2 pr-3 font-semibold">{c}</th>)}
            <th className="py-2 text-right font-semibold">Acción</th>
          </tr>
        </thead>
        <tbody>
          {cuotas.map((cuota) => {
            const estilo = ESTILOS_ESTADO_CUOTA[cuota.estado] || ESTILOS_ESTADO_CUOTA.pendiente;
            const pagada = cuota.estado === "pagada";
            return (
              <tr key={cuota.id} className="border-t border-gray-100">
                <td className="py-3 pr-3 first-letter:uppercase text-[#3a4147]">{formatearPeriodo(cuota.mes_anio)}</td>
                <td className="py-3 pr-3 font-bold text-[#151515]">{formatearMonto(cuota.monto)}</td>
                <td className="py-3 pr-3 text-[#3a4147]">{formatearFechaCuota(cuota.fecha_vencimiento)}</td>
                <td className="py-3 pr-3"><span className={`inline-block min-w-20 px-2 py-1 text-center ${estilo.clase}`}>{estilo.texto}</span></td>
                <td className="py-3 pr-3 text-[#3a4147]">{pagada ? formatearFechaCuota(cuota.pago?.fechaPago) : "-"}</td>
                <td className="py-3 text-right">
                  {pagada ? (
                    <button type="button" disabled={Boolean(procesando)} onClick={() => onDescargar(cuota)} className="inline-flex items-center gap-2 border border-gray-300 bg-[#f5f9fc] px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-60">
                      {procesando === `comprobante-${cuota.id}` ? "Descargando..." : "Comprobante"} <FaDownload />
                    </button>
                  ) : (
                    <button type="button" disabled={Boolean(procesando)} onClick={() => onPagar(cuota)} className="inline-flex items-center gap-2 bg-[#2693bf] px-3 py-1.5 text-sm font-bold text-white hover:bg-[#1b789f] disabled:opacity-60">
                      Pagar <FaCreditCard />
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
