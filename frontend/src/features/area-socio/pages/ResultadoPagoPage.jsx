import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import {
  FaCircleCheck,
  FaCircleXmark,
  FaClock,
  FaDownload,
} from "react-icons/fa6";
import { useAccionesCuota } from "../hooks/useAccionesCuota";
import { elegirCuotaActual, formatearMonto, formatearPeriodo } from "../utils/cuotas";

const INTERVALO_POLLING_MS = 3000;
const TIEMPO_MAXIMO_ESPERA_MS = 60000;

// Mercado Pago redirige acá con parámetros en la URL (status, payment_id, external_reference…).
// El estado real lo define únicamente el webhook del backend; acá consultamos periódicamente
// las cuotas del socio hasta que figure como "pagada" o pasen 60 segundos.
const CONTENIDO = {
  confirmado: {
    Icono: FaCircleCheck,
    colorIcono: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200",
    insignia: "Operación acreditada",
    colorInsignia: "bg-emerald-50 text-emerald-700 border-emerald-200",
    titulo: "¡Pago confirmado!",
    texto:
      "Mercado Pago acreditó tu operación y tu cuota ya figura como pagada. Ya podés descargar tu constancia de pago.",
  },
  verificando: {
    Icono: FaClock,
    colorIcono: "bg-surface-blue text-primary ring-1 ring-primary/20",
    insignia: "Confirmando operación",
    colorInsignia: "bg-surface-blue text-primary border-primary/20",
    titulo: "¡Recibimos tu pago!",
    texto:
      "Estamos aguardando la confirmación automática de Mercado Pago para actualizar tu cuota y generar tu constancia...",
  },
  pendiente: {
    Icono: FaClock,
    colorIcono: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
    insignia: "Pendiente de acreditación",
    colorInsignia: "bg-amber-50 text-amber-800 border-amber-200",
    titulo: "Tu pago está en proceso",
    texto:
      "Mercado Pago todavía está procesando o verificando la operación. Cuando se acredite, tu cuota se actualizará automáticamente.",
  },
  fallido: {
    Icono: FaCircleXmark,
    colorIcono: "bg-red-50 text-red-600 ring-1 ring-red-200",
    insignia: "Operación no completada",
    colorInsignia: "bg-red-50 text-red-700 border-red-200",
    titulo: "No se pudo completar el pago",
    texto:
      "La operación fue rechazada o cancelada. No se realizó ningún cobro. Podés intentarlo nuevamente desde la sección Pagos.",
  },
};

export default function ResultadoPagoPage({ tipo }) {
  const outlet = useOutletContext() || {};
  const { cuotas, recargarCuotas } = outlet;
  const [searchParams] = useSearchParams();
  const acciones = useAccionesCuota();

  const referenciaExterna = searchParams.get("external_reference");
  const [tiempoAgotado, setTiempoAgotado] = useState(false);

  // Buscamos la cuota pagada correspondiente (por external_reference o la cuota actual si ya figura pagada)
  const cuotaConfirmada = useMemo(() => {
    if (!Array.isArray(cuotas) || cuotas.length === 0) return null;
    if (referenciaExterna) {
      const encontrada = cuotas.find((c) => String(c.id) === String(referenciaExterna));
      return encontrada?.estado === "pagada" ? encontrada : null;
    }
    const actual = elegirCuotaActual(cuotas);
    return actual?.estado === "pagada" ? actual : null;
  }, [cuotas, referenciaExterna]);

  const yaConfirmado = Boolean(cuotaConfirmada) && tipo !== "fallido";
  const debePollear = (tipo === "exitoso" || tipo === "pendiente") && !yaConfirmado && !tiempoAgotado;

  useEffect(() => {
    setTiempoAgotado(false);
  }, [tipo, referenciaExterna]);

  useEffect(() => {
    if (!debePollear || typeof recargarCuotas !== "function") return undefined;

    // Primera consulta inmediata al montar
    recargarCuotas();

    const intervalo = setInterval(() => {
      recargarCuotas();
    }, INTERVALO_POLLING_MS);

    const limite = setTimeout(() => {
      setTiempoAgotado(true);
    }, TIEMPO_MAXIMO_ESPERA_MS);

    return () => {
      clearInterval(intervalo);
      clearTimeout(limite);
    };
  }, [debePollear, recargarCuotas]);

  let estadoVista = "pendiente";
  if (tipo === "fallido") {
    estadoVista = "fallido";
  } else if (yaConfirmado) {
    estadoVista = "confirmado";
  } else if (tipo === "exitoso" && !tiempoAgotado) {
    estadoVista = "verificando";
  } else {
    estadoVista = "pendiente";
  }

  const { Icono, colorIcono, insignia, colorInsignia, titulo, texto } =
    CONTENIDO[estadoVista] || CONTENIDO.pendiente;

  return (
    <section className="py-6 sm:py-10">
      <div className="mx-auto max-w-xl rounded-none border border-primary/15 bg-white p-7 text-center shadow-xs sm:p-9">
        <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl text-3xl ${colorIcono}`}>
          {estadoVista === "verificando" ? (
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-full border-3 border-primary/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            </div>
          ) : (
            <Icono />
          )}
        </div>

        <span
          className={`mt-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${colorInsignia}`}
        >
          {insignia}
        </span>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
          {titulo}
        </h1>
        <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-slate-600">{texto}</p>

        {yaConfirmado && cuotaConfirmada && (
          <div className="mt-5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-3 text-xs text-slate-700 sm:text-sm">
            <span className="font-semibold text-navy">
              Cuota {formatearPeriodo(cuotaConfirmada.mes_anio)}
            </span>{" "}
            · <strong className="tabular-nums text-emerald-700">{formatearMonto(cuotaConfirmada.monto)}</strong>
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/socios"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-navy transition-colors hover:bg-surface-blue hover:text-primary sm:text-sm"
          >
            Ir al inicio
          </Link>

          {yaConfirmado && cuotaConfirmada && (
            <button
              type="button"
              disabled={Boolean(acciones.procesando)}
              onClick={() => acciones.descargar(cuotaConfirmada)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-primary/25 bg-surface-blue px-4 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-60 sm:text-sm"
            >
              <FaDownload className="text-xs" />
              {acciones.procesando ? "Descargando..." : "Descargar constancia"}
            </button>
          )}

          <Link
            to="/socios/pagos"
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-navy sm:text-sm"
          >
            Ver mis pagos
          </Link>
        </div>
      </div>
    </section>
  );
}
