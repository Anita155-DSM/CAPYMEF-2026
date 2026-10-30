import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { FaArrowsRotate, FaCircleInfo, FaHandshake } from "react-icons/fa6";
import AvisoCuotasNoDisponibles from "../components/pagos/AvisoCuotasNoDisponibles";
import ModalPagoCuotaLazy from "../components/pagos/ModalPagoCuotaLazy";
import TablaCuotas from "../components/pagos/TablaCuotas";
import TarjetaCuota from "../components/pagos/TarjetaCuota";
import { useAccionesCuota } from "../hooks/useAccionesCuota";
import { elegirCuotaActual, formatearMonto, ordenarPorPeriodo } from "../utils/cuotas";

/**
 * Categorías que no abonan cuota mensual pero cuyo acceso
 * a esta página está bloqueado directamente desde el sidebar.
 * Esta página solo la verán: activo y padrino.
 */
const ES_PADRINO = (categoria) => categoria?.toLowerCase() === "padrino";

const FILTROS = [
  { valor: "todas", texto: "Todas" },
  { valor: "impagas", texto: "Por pagar" },
  { valor: "pagada", texto: "Pagadas" },
];

const coincide = (cuota, filtro) =>
  filtro === "todas" || (filtro === "impagas" ? cuota.estado !== "pagada" : cuota.estado === "pagada");

export default function PagosSocioPage() {
  const { cuotas, errorCuotas, recargarCuotas, usuario } = useOutletContext();
  const acciones = useAccionesCuota();
  const [filtro, setFiltro] = useState("todas");
  const [actualizando, setActualizando] = useState(false);

  const esPadrino = ES_PADRINO(usuario?.categoria);

  const ordenadas = useMemo(() => ordenarPorPeriodo(Array.isArray(cuotas) ? cuotas : []), [cuotas]);
  const cuotaActual = useMemo(() => elegirCuotaActual(ordenadas), [ordenadas]);
  const deudaTotal = ordenadas.filter((c) => c.estado !== "pagada").reduce((total, c) => total + (Number(c.monto) || 0), 0);

  const actualizar = async () => {
    setActualizando(true);
    await recargarCuotas();
    setActualizando(false);
  };

  // ─── Vista especial para socios Padrino ───────────────────────────────────
  if (esPadrino) {
    return (
      <div className="space-y-6">
        <header>
          <p className="mb-1 text-sm font-semibold text-primary">TU APORTE A CAPYMEF</p>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-navy sm:text-3xl">
            Contribuciones
          </h1>
        </header>

        {/* Banner explicativo del rol Padrino */}
        <div className="flex items-start gap-4 rounded-2xl border border-primary/20 bg-surface-blue p-5 sm:p-6">
          <FaHandshake className="mt-0.5 shrink-0 text-2xl text-primary" />
          <div>
            <p className="font-bold text-navy">Sos socio Padrino de CAPYMEF</p>
            <p className="mt-1 text-sm text-gray-700">
              Como Padrino, tu vínculo con la Cámara se basa en contribuciones y donaciones ocasionales,
              no en una cuota mensual fija. Si realizaste alguna contribución, podés consultar
              el historial a continuación o comunicarte con la administración.
            </p>
            <a
              href="mailto:info@capymef.ar"
              className="mt-3 inline-block text-sm font-bold text-primary hover:underline"
            >
              Consultar a info@capymef.ar
            </a>
          </div>
        </div>

        {/* Si el backend devuelve movimientos para padrinos, los mostramos igual */}
        {Array.isArray(cuotas) && cuotas.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-center">
              <h2 className="text-lg font-medium uppercase text-gray-600">Historial de contribuciones</h2>
              <button
                type="button"
                onClick={actualizar}
                disabled={actualizando}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-navy shadow-xs transition-colors hover:bg-surface-blue hover:text-primary disabled:opacity-60"
              >
                <FaArrowsRotate className={actualizando ? "animate-spin" : ""} /> Actualizar
              </button>
            </div>
            <TablaCuotas
              cuotas={ordenadas}
              procesando={acciones.procesando}
              onPagar={acciones.pagar}
              onDescargar={acciones.descargar}
            />
          </section>
        )}

        {acciones.cuotaAPagar && <ModalPagoCuotaLazy cuota={acciones.cuotaAPagar} onClose={acciones.cerrarPago} />}
      </div>
    );
  }

  // ─── Vista estándar para socios Activos ───────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="mb-1 text-sm font-semibold text-primary">TUS CUOTAS</p>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-navy sm:text-3xl">Pagos</h1>
          <p className="mt-1 text-sm text-gray-600">Consultá tus cuotas, pagá online y descargá tus comprobantes.</p>
        </div>
        <button
          type="button"
          onClick={actualizar}
          disabled={actualizando || cuotas === undefined}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-navy shadow-xs transition-colors hover:bg-surface-blue hover:text-primary disabled:opacity-60"
        >
          <FaArrowsRotate className={actualizando ? "animate-spin" : ""} /> Actualizar
        </button>
      </div>

      <div className="space-y-6">
        <TarjetaCuota cuota={cuotaActual} cuotas={cuotas} errorCuotas={errorCuotas} />

        <div className="flex items-start gap-3 rounded-xl border-l-4 border-primary bg-white p-4 text-sm text-gray-700 shadow-sm">
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
              {deudaTotal > 0 && <p className="text-sm font-medium text-red-600">Saldo adeudado: <strong>{formatearMonto(deudaTotal)}</strong></p>}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar cuotas">
              {FILTROS.map(({ valor, texto }) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setFiltro(valor)}
                  aria-pressed={filtro === valor}
                  className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                    filtro === valor
                      ? "bg-sidebar text-white shadow-sm"
                      : "border border-gray-200 bg-white text-sidebar hover:bg-surface-blue"
                  }`}
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
    </div>
  );
}

function ListadoCuotas({ cuotas, errorCuotas, visibles, acciones }) {
  if (cuotas === undefined) return <p className="py-8 text-center text-sm text-gray-600">Cargando cuotas...</p>;
  if (cuotas === null) return <AvisoCuotasNoDisponibles />;
  if (errorCuotas) return <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorCuotas}</p>;
  if (!visibles.length) return <p className="py-8 text-center text-sm text-gray-600">No hay cuotas para mostrar.</p>;
  return <TablaCuotas cuotas={visibles} procesando={acciones.procesando} onPagar={acciones.pagar} onDescargar={acciones.descargar} />;
}
