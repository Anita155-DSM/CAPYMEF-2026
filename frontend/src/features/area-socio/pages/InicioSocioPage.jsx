import { useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { FaCircleCheck, FaRegClock, FaTriangleExclamation } from "react-icons/fa6";
import EstadoCuenta from "../components/EstadoCuenta";
import TarjetaCuota from "../components/TarjetaCuota";
import TarjetaNovedades from "../components/TarjetaNovedades";
import TarjetaProximoEvento from "../components/TarjetaProximoEvento";
import { useNovedadesInicio } from "../hooks/useNovedadesInicio";
import { elegirCuotaActual } from "../utils/cuotas";

const insignia = "inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white shadow-sm";

/**
 * Insignia de la esquina: refleja la situación REAL de las cuotas.
 * (Antes decía "Estás al día" también cuando todavía no había ninguna cuota generada.)
 */
function EstadoDePagos({ cuotas, errorCuotas }) {
  if (!Array.isArray(cuotas) || errorCuotas) return null; // cargando, no disponible o con error: no afirmamos nada

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
  const { usuario, cuotas, errorCuotas } = useOutletContext(); // vienen del SocioLayout
  const { evento, noticias } = useNovedadesInicio();

  const cuotaActual = useMemo(() => (Array.isArray(cuotas) ? elegirCuotaActual(cuotas) : null), [cuotas]);

  const nombreEmpresa = usuario.razonSocial || "Tu empresa";
  const rubro = usuario.rubro || "Rubro no informado";
  const localidad = usuario.localidad || "Localidad no informada";

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-semibold text-primary">PANEL DE SOCIO</p>
          <h1 className="break-words text-2xl font-bold uppercase tracking-tight text-navy sm:text-3xl">Hola, {nombreEmpresa}</h1>
          <p className="mt-2 text-sm text-gray-600">
            Socio N° {usuario.id || "-"} <span className="mx-2">•</span> {rubro} <span className="mx-2">•</span> {localidad}
          </p>
        </div>
        <EstadoDePagos cuotas={cuotas} errorCuotas={errorCuotas} />
      </section>

      <TarjetaCuota cuota={cuotaActual} cuotas={cuotas} errorCuotas={errorCuotas} />

      {/* Las dos columnas miden lo mismo: Novedades se estira hasta el final de la columna izquierda */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <div className="space-y-6">
          <EstadoCuenta cuotas={cuotas} />
          <TarjetaProximoEvento estado={evento} />
        </div>
        <TarjetaNovedades estado={noticias} />
      </div>
    </div>
  );
}