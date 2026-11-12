import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FaArrowsRotate,
  FaCircleInfo,
  FaClockRotateLeft,
  FaHandshake,
  FaReceipt,
} from "react-icons/fa6";
import AvisoCuotasNoDisponibles from "../components/pagos/AvisoCuotasNoDisponibles";
import ModalPagoCuotaLazy from "../components/pagos/ModalPagoCuotaLazy";
import TablaCuotas from "../components/pagos/TablaCuotas";
import TarjetaCuota from "../components/pagos/TarjetaCuota";
import { useAccionesCuota } from "../hooks/useAccionesCuota";
import {
  abonaCuotaSocial,
  elegirCuotaActual,
  formatearMonto,
  mayuscula,
  ordenarPorPeriodo,
} from "../utils/cuotas";

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

  const categoriaLower = usuario?.categoria?.toLowerCase() || "";
  const esExentoCuotaFija = !abonaCuotaSocial(usuario?.categoria, cuotas);

  const ordenadas = useMemo(() => ordenarPorPeriodo(Array.isArray(cuotas) ? cuotas : []), [cuotas]);
  const cuotaActual = useMemo(() => elegirCuotaActual(ordenadas), [ordenadas]);
  const deudaTotal = ordenadas
    .filter((c) => c.estado !== "pagada")
    .reduce((total, c) => total + (Number(c.monto) || 0), 0);

  const actualizar = async () => {
    setActualizando(true);
    await recargarCuotas();
    setActualizando(false);
  };

  // ─── Vista especial para socios sin cuota mensual fija (Padrino, Honorario, Adherente) ───
  if (esExentoCuotaFija) {
    const etiquetaCat = mayuscula(categoriaLower) || "Socio";
    return (
      <div className="space-y-6">
        <header className="relative overflow-hidden rounded-none border border-primary/15 bg-linear-to-r from-white via-white to-surface-blue p-5 shadow-xs sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Tu vínculo con CAPYMEF
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
            Estado de aportes
          </h1>
        </header>

        <div className="flex items-start gap-4 rounded-none border border-primary/20 bg-surface-blue/70 p-5 sm:p-6">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-xl text-primary shadow-2xs">
            <FaHandshake />
          </span>
          <div>
            <p className="font-semibold text-navy">Tu categoría no abona cuota mensual</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Sos socio <strong>{etiquetaCat}</strong> de CAPYMEF. Por estatuto, tu categoría societaria no registra una cuota mensual obligatoria. Si realizaste alguna contribución o tenés consultas administrativas, podés comunicarte con la Cámara.
            </p>
            <a
              href="mailto:info@capymef.ar"
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Consultar a info@capymef.ar
            </a>
          </div>
        </div>

        {Array.isArray(cuotas) && cuotas.length > 0 && (
          <section className="rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-3 border-b border-slate-100 pb-3.5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
                  <FaClockRotateLeft />
                </span>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-navy">
                  Historial de contribuciones
                </h2>
              </div>
              <button
                type="button"
                onClick={actualizar}
                disabled={actualizando}
                className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy shadow-2xs transition-colors hover:bg-surface-blue hover:text-primary disabled:opacity-60 sm:text-sm"
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

        {acciones.cuotaAPagar && (
          <ModalPagoCuotaLazy cuota={acciones.cuotaAPagar} onClose={acciones.cerrarPago} />
        )}
      </div>
    );
  }

  // ─── Vista estándar para socios Activos ───────────────────────────────────
  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-none border border-primary/15 bg-linear-to-r from-white via-white to-surface-blue p-5 shadow-xs sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/6"
        />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Tus cuotas sociales
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
              Pagos y comprobantes
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Consultá el estado de tus cuotas, aboná de forma online y descargá tus comprobantes.
            </p>
          </div>
          <button
            type="button"
            onClick={actualizar}
            disabled={actualizando || cuotas === undefined}
            className="inline-flex w-fit shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-xs font-semibold text-navy shadow-2xs transition-colors hover:bg-surface-blue hover:text-primary disabled:opacity-60 sm:text-sm"
          >
            <FaArrowsRotate className={actualizando ? "animate-spin text-primary" : "text-primary"} />
            Actualizar estado
          </button>
        </div>
      </header>

      <div className="grid items-center gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <TarjetaCuota cuota={cuotaActual} cuotas={cuotas} errorCuotas={errorCuotas} />
        </div>

        <div className="flex items-start gap-3.5 px-1 lg:col-span-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-blue text-base text-primary">
            <FaCircleInfo />
          </span>
          <div className="text-xs leading-relaxed text-slate-600 sm:text-sm">
            <p className="font-semibold text-navy">Información sobre el abono mensual</p>
            <p className="mt-1">
              La cuota social se abona del <strong>1 al 10</strong> de cada mes. Una vez acreditado el
              pago, tu cuota pasa a <strong>Pagada</strong> y recibís el comprobante por correo.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
              <FaClockRotateLeft />
            </span>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-navy">
                Historial de cuotas
              </h2>
              {deudaTotal > 0 && (
                <p className="mt-0.5 text-xs font-medium text-red-600">
                  Saldo pendiente: <strong className="tabular-nums">{formatearMonto(deudaTotal)}</strong>
                </p>
              )}
            </div>
          </div>

          <div
            className="inline-flex w-fit flex-wrap gap-1 rounded-xl bg-surface p-1 ring-1 ring-slate-200/80"
            role="group"
            aria-label="Filtrar cuotas"
          >
            {FILTROS.map(({ valor, texto }) => (
              <button
                key={valor}
                type="button"
                onClick={() => setFiltro(valor)}
                aria-pressed={filtro === valor}
                className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                  filtro === valor
                    ? "bg-sidebar text-white shadow-2xs"
                    : "text-slate-600 hover:text-navy"
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

      {acciones.cuotaAPagar && (
        <ModalPagoCuotaLazy cuota={acciones.cuotaAPagar} onClose={acciones.cerrarPago} />
      )}
    </div>
  );
}

function ListadoCuotas({ cuotas, errorCuotas, visibles, acciones }) {
  if (cuotas === undefined) {
    return (
      <div className="rounded-xl bg-surface py-10 text-center text-sm text-slate-500">
        Cargando cuotas...
      </div>
    );
  }
  if (cuotas === null) return <AvisoCuotasNoDisponibles />;
  if (errorCuotas) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {errorCuotas}
      </p>
    );
  }
  if (!visibles.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-surface py-10 text-center">
        <span className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-white text-lg text-primary/70 shadow-2xs">
          <FaReceipt />
        </span>
        <p className="text-sm font-semibold text-navy">No hay cuotas para mostrar</p>
        <p className="mt-0.5 text-xs text-slate-500">
          No se registran movimientos con el filtro seleccionado.
        </p>
      </div>
    );
  }
  return (
    <TablaCuotas
      cuotas={visibles}
      procesando={acciones.procesando}
      onPagar={acciones.pagar}
      onDescargar={acciones.descargar}
    />
  );
}
