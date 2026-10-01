import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { FaArrowsRotate, FaCircleInfo, FaCreditCard, FaDownload } from "react-icons/fa6";
import {
  ESTILOS_ESTADO_CUOTA,
  elegirCuotaActual,
  formatearFecha,
  formatearMonto,
  formatearPeriodo,
} from "../../services/socioServices";
import TarjetaCuota, { AvisoCuotasNoDisponibles } from "./Components/TarjetaCuota";
import useAccionesCuota from "./Hooks/useAccionesCuota";

const FILTROS = [
  { valor: "todas", texto: "Todas" },
  { valor: "impagas", texto: "Por pagar" },
  { valor: "pagada", texto: "Pagadas" },
];

export default function PagosSocio() {
  const { cuotas, errorCuotas, recargarCuotas } = useOutletContext();
  const { procesando, pagar, descargar } = useAccionesCuota();
  const [filtro, setFiltro] = useState("todas");
  const [actualizando, setActualizando] = useState(false);

  const ordenadas = useMemo(
    () => (Array.isArray(cuotas) ? [...cuotas].sort((a, b) => String(b.mes_anio).localeCompare(String(a.mes_anio))) : []),
    [cuotas]
  );
  const cuotaActual = useMemo(() => elegirCuotaActual(ordenadas), [ordenadas]);
  const visibles = ordenadas.filter((cuota) =>
    filtro === "todas" ? true : filtro === "impagas" ? cuota.estado !== "pagada" : cuota.estado === "pagada"
  );
  const deudaTotal = ordenadas.filter((c) => c.estado !== "pagada").reduce((total, c) => total + (Number(c.monto) || 0), 0);

  const actualizar = async () => {
    setActualizando(true);
    await recargarCuotas();
    setActualizando(false);
  };

  return (
    <section className="min-h-[calc(100vh-9rem)] bg-[#edf7fd] px-1 py-2 sm:px-3 sm:py-5">
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-normal uppercase text-[#073d6f] sm:text-[25px]">Pagos</h1>
          <p className="mt-1 text-sm text-[#6b7884]">Consultá tus cuotas, pagá online y descargá tus comprobantes.</p>
        </div>
        <button
          type="button"
          onClick={actualizar}
          disabled={actualizando || cuotas === undefined}
          className="inline-flex w-fit items-center gap-2 border border-[#d7e0e5] bg-[#f4f9fc] px-3 py-2 text-sm text-[#17384f] hover:bg-[#e7f2f8] disabled:opacity-60"
        >
          <FaArrowsRotate className={actualizando ? "animate-spin" : ""} /> Actualizar
        </button>
      </div>

      <div className="space-y-6">
        <TarjetaCuota cuota={cuotaActual} cuotas={cuotas} errorCuotas={errorCuotas} />

        <div className="flex items-start gap-3 border-l-4 border-[#1D7BB6] bg-white p-4 text-sm text-gray-700 shadow-sm">
          <FaCircleInfo className="mt-0.5 shrink-0 text-[#1D7BB6]" />
          <p>
            La cuota se abona del <strong>1 al 10</strong> de cada mes. El pago online se procesa con Mercado Pago:
            cuando se acredita, tu cuota pasa a <strong>Pagada</strong> y el comprobante te llega por correo.
            Si acabás de pagar y todavía figura pendiente, esperá unos minutos y tocá "Actualizar".
          </p>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col justify-between gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-medium uppercase text-gray-600">Historial de cuotas</h2>
              {deudaTotal > 0 && <p className="text-sm text-[#9b3418]">Saldo adeudado: <strong>{formatearMonto(deudaTotal)}</strong></p>}
            </div>
            <div className="flex gap-2" role="group" aria-label="Filtrar cuotas">
              {FILTROS.map(({ valor, texto }) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setFiltro(valor)}
                  aria-pressed={filtro === valor}
                  className={`px-3 py-1.5 text-sm ${filtro === valor ? "bg-[#1b527d] font-bold text-white" : "border border-[#d7e0e5] bg-[#f4f9fc] text-[#17384f] hover:bg-[#e7f2f8]"}`}
                >
                  {texto}
                </button>
              ))}
            </div>
          </div>

          {cuotas === undefined ? (
            <p className="py-8 text-center text-sm text-gray-600">Cargando cuotas...</p>
          ) : cuotas === null ? (
            <AvisoCuotasNoDisponibles />
          ) : errorCuotas ? (
            <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorCuotas}</p>
          ) : visibles.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-600">No hay cuotas para mostrar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase text-[#66727d]">
                    <th className="py-2 pr-3 font-semibold">Período</th>
                    <th className="py-2 pr-3 font-semibold">Monto</th>
                    <th className="py-2 pr-3 font-semibold">Vencimiento</th>
                    <th className="py-2 pr-3 font-semibold">Estado</th>
                    <th className="py-2 pr-3 font-semibold">Fecha de pago</th>
                    <th className="py-2 text-right font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((cuota) => {
                    const estilo = ESTILOS_ESTADO_CUOTA[cuota.estado] || ESTILOS_ESTADO_CUOTA.pendiente;
                    const pagada = cuota.estado === "pagada";
                    return (
                      <tr key={cuota.id} className="border-t border-gray-100">
                        <td className="py-3 pr-3 first-letter:uppercase text-[#3a4147]">{formatearPeriodo(cuota.mes_anio)}</td>
                        <td className="py-3 pr-3 font-bold text-[#151515]">{formatearMonto(cuota.monto)}</td>
                        <td className="py-3 pr-3 text-[#3a4147]">{formatearFecha(cuota.fecha_vencimiento)}</td>
                        <td className="py-3 pr-3"><span className={`inline-block min-w-20 px-2 py-1 text-center ${estilo.clase}`}>{estilo.texto}</span></td>
                        <td className="py-3 pr-3 text-[#3a4147]">{pagada ? formatearFecha(cuota.pago?.fechaPago) : "-"}</td>
                        <td className="py-3 text-right">
                          {pagada ? (
                            <button
                              type="button"
                              disabled={Boolean(procesando)}
                              onClick={() => descargar(cuota)}
                              className="inline-flex items-center gap-2 border border-gray-300 bg-[#f5f9fc] px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-60"
                            >
                              {procesando === `comprobante-${cuota.id}` ? "Descargando..." : "Comprobante"} <FaDownload />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={Boolean(procesando)}
                              onClick={() => pagar(cuota)}
                              className="inline-flex items-center gap-2 bg-[#2693bf] px-3 py-1.5 text-sm font-bold text-white hover:bg-[#1b789f] disabled:opacity-60"
                            >
                              {procesando === `pagar-${cuota.id}` ? "Redirigiendo..." : "Pagar"} <FaCreditCard />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
