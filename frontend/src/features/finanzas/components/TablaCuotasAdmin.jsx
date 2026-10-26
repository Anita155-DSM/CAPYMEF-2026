import { FaFileDownload } from "react-icons/fa";
import { ESTADOS_CUOTA, formatearMonto, mayuscula, nombreCuota } from "../utils/cuotas";

function EstadoCuota({ estado }) {
  const config = ESTADOS_CUOTA[estado] ?? { texto: String(estado || "-").toUpperCase(), punto: "bg-gray-400" };
  return (
    <span className="inline-flex items-center gap-2 font-medium text-gray-800">
      <span className={`h-2.5 w-2.5 rounded-full ${config.punto}`} aria-hidden="true" />
      {config.texto}
    </span>
  );
}

/** Tabla del historial de cuotas. El comprobante solo aparece en las pagadas. */
export default function TablaCuotasAdmin({ cuotas, mensajeVacio, descargandoId, onDescargar }) {
  const columnas = ["Socio", "Cuota", "Categoría", "Monto", "Estado", "Comprobante"];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-navy text-white">
            {columnas.map((titulo) => (
              <th key={titulo} className={`py-3 px-4 font-semibold text-sm ${titulo === "Comprobante" ? "text-center" : ""}`}>
                {titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cuotas.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} className="py-6 text-center text-gray-500 font-medium">
                {mensajeVacio}
              </td>
            </tr>
          ) : (
            cuotas.map((cuota) => (
              <tr key={cuota.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <p className="text-gray-800 font-medium">{cuota.socio?.razonSocial ?? "Socio eliminado"}</p>
                  <p className="text-xs text-gray-500">{cuota.socio?.cuit}</p>
                </td>
                <td className="py-3 px-4 text-gray-700">{nombreCuota(cuota.mes_anio)}</td>
                <td className="py-3 px-4 text-gray-600">{mayuscula(cuota.socio?.categoria)}</td>
                <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{formatearMonto(cuota.monto)}</td>
                <td className="py-3 px-4"><EstadoCuota estado={cuota.estado} /></td>
                <td className="py-3 px-4 text-center">
                  {cuota.estado === "pagada" && (
                    <button
                      type="button"
                      onClick={() => onDescargar(cuota)}
                      disabled={descargandoId === cuota.id}
                      className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-colors shadow-sm disabled:opacity-50"
                      title="Descargar comprobante"
                      aria-label={`Descargar comprobante de ${nombreCuota(cuota.mes_anio)}`}
                    >
                      <FaFileDownload size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
