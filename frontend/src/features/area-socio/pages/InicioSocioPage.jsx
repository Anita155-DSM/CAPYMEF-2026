import { useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { FaCircleCheck, FaRegClock, FaTriangleExclamation } from "react-icons/fa6";
import EstadoCuenta from "../components/pagos/EstadoCuenta";
import TarjetaCuota from "../components/pagos/TarjetaCuota";
import TarjetaNovedades from "../components/inicio/TarjetaNovedades";
import TarjetaProximoEvento from "../components/inicio/TarjetaProximoEvento";
import { useNovedadesInicio } from "../hooks/useNovedadesInicio";
import { abonaCuotaSocial, elegirCuotaActual, mayuscula } from "../utils/cuotas";

const insignia = "inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white shadow-sm";

/**
 * Insignia de la esquina: refleja la situación REAL de las cuotas para socios con cuota mensual activa.
 */
function EstadoDePagos({ cuotas, errorCuotas }) {
  if (!Array.isArray(cuotas) || errorCuotas) return null;

  const impagas = cuotas.filter((c) => c.estado !== "pagada").length;
  const vencidas = cuotas.filter((c) => c.estado === "vencida").length;

  if (cuotas.length === 0) {
    return (
      <span className={`${insignia} bg-gray-500`}>
        <FaRegClock /> Sin cuotas generadas
      </span>
    );
  }
  if (impagas === 0) {
    return (
      <span className={`${insignia} bg-[#00a75d]`}>
        <FaCircleCheck /> ¡Estás al día!
      </span>
    );
  }
  const texto = vencidas
    ? `Tenés ${vencidas === 1 ? "1 cuota vencida" : `${vencidas} cuotas vencidas`}`
    : `Tenés ${impagas === 1 ? "1 cuota por pagar" : `${impagas} cuotas por pagar`}`;
  return (
    <Link to="/socios/pagos" className={`${insignia} ${vencidas ? "bg-[#c0392b] hover:bg-[#a93226]" : "bg-[#e66d4a] hover:bg-[#cf5b39]"}`}>
      <FaTriangleExclamation /> {texto}
    </Link>
  );
}

export default function InicioSocioPage() {
  const { usuario, cuotas, errorCuotas } = useOutletContext();
  const { evento, noticias } = useNovedadesInicio();

  const cuotaActual = useMemo(() => (Array.isArray(cuotas) ? elegirCuotaActual(cuotas) : null), [cuotas]);

  // Solo los socios activos abonan cuota social mensual; Padrinos, Adherentes y Honorarios no
  const sinCuotas = !abonaCuotaSocial(usuario?.categoria);

  const nombreEmpresa = usuario.razonSocial || "Tu empresa";
  const rubro = usuario.rubro || "Rubro no informado";
  const localidad = usuario.localidad || "Localidad no informada";

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-semibold text-primary">PANEL DE SOCIO</p>
          <h1 className="break-words text-2xl font-semibold uppercase tracking-tight text-navy sm:text-3xl">Hola, {nombreEmpresa}</h1>
          <p className="mt-2 text-sm text-gray-600">
            Socio N° {usuario.id || "-"} <span className="mx-2">•</span> {rubro} <span className="mx-2">•</span> {localidad}
          </p>
        </div>

        {sinCuotas ? (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-blue px-3.5 py-1.5 text-xs sm:text-sm font-bold text-primary border border-primary/20 shadow-2xs">
            Categoría {mayuscula(usuario.categoria) || "Socio"}
          </span>
        ) : (
          <EstadoDePagos cuotas={cuotas} errorCuotas={errorCuotas} />
        )}
      </section>

      {/* Si abona cuota (Socio Activo): muestra tarjeta de cuota y estado de cuenta */}
      {!sinCuotas ? (
        <>
          <TarjetaCuota cuota={cuotaActual} cuotas={cuotas} errorCuotas={errorCuotas} />

          {/* Las dos columnas miden lo mismo: Novedades se estira hasta el final de la columna izquierda */}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
            <div className="space-y-6">
              <EstadoCuenta cuotas={cuotas} />
              <TarjetaProximoEvento estado={evento} />
            </div>
            <TarjetaNovedades estado={noticias} />
          </div>
        </>
      ) : (
        /* Si NO abona cuota (Padrino / Adherente / Honorario): vista limpia y distribuida en 2 columnas */
        <div className="grid gap-6 lg:grid-cols-2 items-stretch">
          <TarjetaProximoEvento estado={evento} />
          <TarjetaNovedades estado={noticias} />
        </div>
      )}
    </div>
  );
}
