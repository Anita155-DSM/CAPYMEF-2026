import { FaFileArrowDown, FaFileInvoiceDollar, FaMoneyBillWave } from "react-icons/fa6";
import { formatearFechaCorta, formatearMonto, mayuscula, nombreCuota } from "../utils/cuotas";

const ESTILOS_BADGE = {
  pagada: {
    contenedor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    punto: "bg-emerald-500",
    etiqueta: "Pagada",
  },
  pendiente: {
    contenedor: "bg-amber-50 text-amber-800 border-amber-200",
    punto: "bg-amber-500",
    etiqueta: "Pendiente",
  },
  vencida: {
    contenedor: "bg-red-50 text-red-700 border-red-200",
    punto: "bg-red-500",
    etiqueta: "Vencida",
  },
};

function EstadoCuota({ estado }) {
  const cfg = ESTILOS_BADGE[estado] ?? {
    contenedor: "bg-slate-100 text-slate-600 border-slate-200",
    punto: "bg-slate-400",
    etiqueta: estado || "-",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${cfg.contenedor}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.punto}`} />
      {cfg.etiqueta}
    </span>
  );
}

function CategoriaSocio({ categoria }) {
  const cat = (categoria || "").toLowerCase();
  const clase =
    cat === "padrino"
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : cat === "activo"
        ? "border-primary/20 bg-surface-blue text-primary"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${clase}`}>
      {mayuscula(categoria)}
    </span>
  );
}

function BotonAccion({ cuota, descargandoId, onDescargar, onPagarEfectivo }) {
  if (cuota.estado !== "pagada") {
    return (
      <button
        type="button"
        onClick={() => onPagarEfectivo(cuota)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-navy"
        title="Registrar pago manual / en efectivo"
        aria-label={`Registrar pago de ${nombreCuota(cuota.mes_anio)}`}
      >
        <FaMoneyBillWave className="text-xs" /> Efectivo
      </button>
    );
  }
  const descargando = descargandoId === cuota.id;
  return (
    <button
      type="button"
      onClick={() => onDescargar(cuota)}
      disabled={descargando}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-primary/25 bg-surface-blue/60 px-3.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      title="Descargar comprobante PDF"
      aria-label={`Descargar comprobante de ${nombreCuota(cuota.mes_anio)}`}
    >
      <FaFileArrowDown className="text-xs" />
      <span>{descargando ? "Descargando..." : "Comprobante"}</span>
    </button>
  );
}

/**
 * Historial de cuotas. lg+: tabla. < lg: cuadrícula de tarjetas responsivas.
 * En las pagadas se descarga el comprobante; en las pendientes o vencidas se puede registrar un pago.
 */
export default function TablaCuotasAdmin({
  cuotas,
  mensajeVacio,
  descargandoId,
  onDescargar,
  onPagarEfectivo,
}) {
  const columnas = ["Socio", "Cuota", "Categoría", "Monto", "Estado", "Acciones"];

  if (cuotas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-none border border-slate-200/90 bg-white px-5 py-14 text-center shadow-xs">
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-surface-blue text-xl text-primary">
          <FaFileInvoiceDollar />
        </span>
        <p className="text-base font-semibold text-navy">{mensajeVacio}</p>
        <p className="mt-1 max-w-md text-xs text-slate-500 sm:text-sm">
          Cuando se generen nuevas cuotas mensuales o cambies los filtros aplicados, aparecerán listadas en esta sección.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* CELULAR Y TABLET (< lg): cuadrícula de tarjetas */}
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
        {cuotas.map((cuota) => {
          const vencimiento = formatearFechaCorta(cuota.fecha_vencimiento);
          return (
            <li
              key={cuota.id}
              className="flex flex-col justify-between rounded-none border border-slate-200/90 bg-white p-4 shadow-xs sm:p-5"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="min-w-0">
                  <p className="wrap-break-word text-sm font-semibold text-navy sm:text-base">
                    {cuota.socio?.razonSocial ?? "Socio eliminado"}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-400">
                    CUIT: {cuota.socio?.cuit || "-"}
                  </p>
                </div>
                <div className="shrink-0">
                  <BotonAccion
                    cuota={cuota}
                    descargandoId={descargandoId}
                    onDescargar={onDescargar}
                    onPagarEfectivo={onPagarEfectivo}
                  />
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-xs">
                <dt className="font-semibold uppercase tracking-wider text-slate-400">Cuota</dt>
                <dd className="min-w-0 font-semibold text-slate-700">
                  {nombreCuota(cuota.mes_anio)}
                  {vencimiento && (
                    <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                      (Vence {vencimiento})
                    </span>
                  )}
                </dd>

                <dt className="font-semibold uppercase tracking-wider text-slate-400">Categoría</dt>
                <dd className="min-w-0">
                  <CategoriaSocio categoria={cuota.socio?.categoria} />
                </dd>

                <dt className="font-semibold uppercase tracking-wider text-slate-400">Monto</dt>
                <dd className="font-semibold text-navy tabular-nums">
                  {formatearMonto(cuota.monto)}
                </dd>

                <dt className="font-semibold uppercase tracking-wider text-slate-400">Estado</dt>
                <dd>
                  <EstadoCuota estado={cuota.estado} />
                </dd>
              </dl>
            </li>
          );
        })}
      </ul>

      {/* ESCRITORIO (lg+): tabla */}
      <div className="hidden overflow-x-auto rounded-none border border-slate-200/90 bg-white shadow-xs lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-surface text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {columnas.map((titulo) => (
                <th
                  key={titulo}
                  className={`px-4 py-3.5 ${titulo === "Acciones" ? "text-right" : ""}`}
                >
                  {titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cuotas.map((cuota) => {
              const vencimiento = formatearFechaCorta(cuota.fecha_vencimiento);
              return (
                <tr key={cuota.id} className="transition-colors hover:bg-surface-blue/35">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-navy">
                      {cuota.socio?.razonSocial ?? "Socio eliminado"}
                    </p>
                    <p className="text-xs text-slate-400">{cuota.socio?.cuit || "-"}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-slate-700">{nombreCuota(cuota.mes_anio)}</p>
                    {vencimiento && (
                      <p className="text-[11px] text-slate-400">Vence: {vencimiento}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <CategoriaSocio categoria={cuota.socio?.categoria} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-navy tabular-nums">
                    {formatearMonto(cuota.monto)}
                  </td>
                  <td className="px-4 py-3.5">
                    <EstadoCuota estado={cuota.estado} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <BotonAccion
                      cuota={cuota}
                      descargandoId={descargandoId}
                      onDescargar={onDescargar}
                      onPagarEfectivo={onPagarEfectivo}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
