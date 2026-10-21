import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { FaArrowsRotate, FaCircleInfo } from "react-icons/fa6";
import AvisoCuotasNoDisponibles from "../components/pagos/AvisoCuotasNoDisponibles";
import ModalPagoCuotaLazy from "../components/pagos/ModalPagoCuotaLazy";
import TablaCuotas from "../components/pagos/TablaCuotas";
import TarjetaCuota from "../components/pagos/TarjetaCuota";
import { useAccionesCuota } from "../hooks/useAccionesCuota";
import { elegirCuotaActual, formatearMonto, ordenarPorPeriodo } from "../utils/cuotas";

const FILTROS = [
  { valor: "todas", texto: "Todas" },
  { valor: "impagas", texto: "Por pagar" },
  { valor: "pagada", texto: "Pagadas" },
];

const coincide = (cuota, filtro) =>
  filtro === "todas" || (filtro === "impagas" ? cuota.estado !== "pagada" : cuota.estado === "pagada");

export default function PagosSocioPage() {
  const { cuotas, errorCuotas, recargarCuotas } = useOutletContext();
  const acciones = useAccionesCuota();
  const [filtro, setFiltro] = useState("todas");
  const [actualizando, setActualizando] = useState(false);

  const ordenadas = useMemo(() => ordenarPorPeriodo(Array.isArray(cuotas) ? cuotas : []), [cuotas]);
  const cuotaActual = useMemo(() => elegirCuotaActual(ordenadas), [ordenadas]);
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

        <div className="flex items-start gap-3 border-l-4 border-primary bg-white p-4 text-sm text-gray-700 shadow-sm">
          <FaCircleInfo className="mt-0.5 shrink-0 text-primary" />
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
                  className={`px-3 py-1.5 text-sm ${filtro === valor ? "bg-sidebar font-bold text-white" : "border border-[#d7e0e5] bg-[#f4f9fc] text-[#17384f] hover:bg-[#e7f2f8]"}`}
                >
                  {texto}
                </button>
              ))}
            </div>
          </div>

          <ListadoCuotas
            cuotas={cuotas}
            errorCuotas={errorCuotas}
            visibles={ordenadas.filter((c) => coincide(c, filtro))}
            acciones={acciones}
          />
        </section>
      </div>

      {acciones.cuotaAPagar && <ModalPagoCuotaLazy cuota={acciones.cuotaAPagar} onClose={acciones.cerrarPago} />}
    </section>
  );
}

function ListadoCuotas({ cuotas, errorCuotas, visibles, acciones }) {
  if (cuotas === undefined) return <p className="py-8 text-center text-sm text-gray-600">Cargando cuotas...</p>;
  if (cuotas === null) return <AvisoCuotasNoDisponibles />;
  if (errorCuotas) return <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorCuotas}</p>;
  if (!visibles.length) return <p className="py-8 text-center text-sm text-gray-600">No hay cuotas para mostrar.</p>;
  return <TablaCuotas cuotas={visibles} procesando={acciones.procesando} onPagar={acciones.pagar} onDescargar={acciones.descargar} />;
}
