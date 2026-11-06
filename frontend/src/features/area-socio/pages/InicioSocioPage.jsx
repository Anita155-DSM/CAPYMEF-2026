import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FaGears,
  FaLocationDot,
} from "react-icons/fa6";
import EstadoCuenta from "../components/pagos/EstadoCuenta";
import TarjetaCuota from "../components/pagos/TarjetaCuota";
import TarjetaNovedades from "../components/inicio/TarjetaNovedades";
import TarjetaProximoEvento from "../components/inicio/TarjetaProximoEvento";
import { useNovedadesInicio } from "../hooks/useNovedadesInicio";
import { abonaCuotaSocial, elegirCuotaActual } from "../utils/cuotas";
import { iniciales } from "../utils/empresa";

const chipMeta =
  "inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-surface-blue/70 px-2.5 py-1 text-xs font-medium text-sidebar";

export default function InicioSocioPage() {
  const { usuario, cuotas, errorCuotas } = useOutletContext();
  const { evento, noticias } = useNovedadesInicio();

  const cuotaActual = useMemo(
    () => (Array.isArray(cuotas) ? elegirCuotaActual(cuotas) : null),
    [cuotas]
  );

  // Abonan cuota los socios activos o quienes tengan cuotas emitidas (ej: degradado a Adherente por mora)
  const sinCuotas = !abonaCuotaSocial(usuario?.categoria, cuotas);

  const nombreEmpresa = usuario.razonSocial || "Tu empresa";
  const rubro = usuario.rubro || "Rubro no informado";
  const localidad = usuario.localidad || "Localidad no informada";

  return (
    <div className="space-y-6">
      {/* Cabecera institucional de bienvenida */}
      <section className="relative overflow-hidden rounded-none border border-primary/15 bg-linear-to-r from-white via-white to-surface-blue p-5 shadow-xs sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/6"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 right-28 h-36 w-36 rounded-full bg-primary/4"
        />

        <div className="relative flex min-w-0 items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-sidebar to-primary text-lg font-semibold text-white shadow-sm">
            {iniciales(nombreEmpresa)}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Panel de Socio
            </p>
            <h1 className="mt-0.5 break-words text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
              Hola, {nombreEmpresa}
            </h1>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className={chipMeta}>
                <FaGears className="text-primary" /> {rubro}
              </span>
              <span className={chipMeta}>
                <FaLocationDot className="text-primary" /> {localidad}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Si abona cuota (Socio Activo): muestra fila financiera arriba (Cuota actual más ancha y Estado de la cuenta más compacto) */}
      {!sinCuotas && (
        <div className="grid items-stretch gap-6 lg:grid-cols-[460px_minmax(0,1fr)] xl:grid-cols-2">
          <TarjetaCuota cuota={cuotaActual} cuotas={cuotas} errorCuotas={errorCuotas} />
          <EstadoCuenta cuotas={cuotas} />
        </div>
      )}

      {/* Fila institucional: Próximo evento compacto y Novedades alargado con la misma altura */}
      <div className="grid items-stretch gap-6 lg:grid-cols-[384px_minmax(0,1fr)]">
        <TarjetaProximoEvento estado={evento} />
        <TarjetaNovedades estado={noticias} />
      </div>
    </div>
  );
}
