import { useMemo } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCircleCheck,
} from "react-icons/fa6";
import dayjs from "@/shared/utils/fechas";
import { yaTermino } from "../../utils/eventos";

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/**
 * Calendario mensual interactivo para socios.
 * Mantiene la disposición limpia, compacta y centrada del diseño original,
 * integrando la paleta institucional y la leyenda de estados solicitada.
 */
export default function CalendarioEventos({ mes, onCambiarMes, eventos = [], onSeleccionar }) {
  // Celdas: huecos iniciales hasta el primer lunes + días del mes
  const celdas = useMemo(() => {
    const huecos = (mes.day() + 6) % 7;
    return [...Array(huecos).fill(null), ...Array.from({ length: mes.daysInMonth() }, (_, i) => i + 1)];
  }, [mes]);

  const hoy = dayjs();

  const eventosDelDia = (dia) => {
    if (!dia) return [];
    const fechaStr = mes.date(dia).format("YYYY-MM-DD");
    return eventos.filter((e) => e.fecha && e.fecha.split("T")[0] === fechaStr);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      {/* Barra superior de mes y controles de navegación */}
      <div className="flex items-center justify-between border-b-2 border-primary/20 pb-2.5 text-primary">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => onCambiarMes(mes.subtract(1, "month"))}
          className="rounded-lg p-2 text-primary transition-colors hover:bg-surface-blue"
        >
          <FaChevronLeft className="text-base" />
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold uppercase tracking-wide text-navy sm:text-2xl">
            {mes.format("MMMM")}
          </h2>
          <span className="text-xl font-semibold text-primary sm:text-2xl">
            {mes.format("YYYY")}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onCambiarMes(dayjs().startOf("month"))}
            className="hidden rounded-md border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-600 transition-colors hover:bg-surface-blue hover:text-primary sm:inline-block"
            title="Volver al mes actual"
          >
            Hoy
          </button>

          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => onCambiarMes(mes.add(1, "month"))}
            className="rounded-lg p-2 text-primary transition-colors hover:bg-surface-blue"
          >
            <FaChevronRight className="text-base" />
          </button>
        </div>
      </div>

      {/* Cabecera de días de la semana */}
      <div className="grid grid-cols-7 pt-3 text-center text-xs font-bold uppercase tracking-wider text-primary sm:text-sm">
        {DIAS_SEMANA.map((d) => (
          <span key={d} className="truncate">
            <span className="sm:hidden">{d.slice(0, 3)}</span>
            <span className="hidden sm:inline">{d}</span>
          </span>
        ))}
      </div>

      {/* Grilla de días mensual: altura reducida y disposición limpia */}
      <div className="grid grid-cols-7 border-b border-gray-100 pb-3 pt-1">
        {celdas.map((dia, i) => {
          const delDia = eventosDelDia(dia);
          const esHoy = Boolean(dia) && mes.date(dia).isSame(hoy, "day");
          const tieneEventos = delDia.length > 0;
          const terminados = tieneEventos && delDia.every(yaTermino);
          const inscripto = delDia.some((e) => e.yaInscripto);

          // Círculo del número de día
          let claseNumero = "flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-xs sm:text-sm transition-colors";
          if (tieneEventos) {
            claseNumero += ` font-bold text-white ${terminados ? "bg-gray-400" : "bg-primary shadow-xs"}`;
          } else {
            claseNumero += " text-navy font-medium";
          }

          if (esHoy) {
            claseNumero += " ring-2 ring-primary ring-offset-2 ring-offset-white font-bold text-primary";
            if (!tieneEventos) claseNumero += " bg-surface-blue";
          }

          return (
            <button
              type="button"
              key={`${dia || "vacio"}-${i}`}
              disabled={!dia || !tieneEventos}
              onClick={() => tieneEventos && onSeleccionar(delDia[0])}
              aria-label={
                dia
                  ? `${dia} de ${mes.format("MMMM")}${
                      delDia.length ? `: ${delDia.map((e) => e.titulo).join(", ")}` : ""
                    }${esHoy ? " (hoy)" : ""}`
                  : undefined
              }
              className={`flex min-h-[62px] sm:min-h-[72px] flex-col items-center justify-start px-1 pt-1.5 transition-colors ${
                dia && tieneEventos
                  ? "cursor-pointer rounded-lg hover:bg-surface-blue/60"
                  : dia
                  ? "cursor-default rounded-lg hover:bg-gray-50/50"
                  : "cursor-default opacity-0"
              }`}
            >
              <span className={claseNumero}>{dia || ""}</span>

              {tieneEventos && (
                <div className="mt-0.5 flex w-full flex-col items-center">
                  <span
                    className={`w-full truncate text-center text-[10px] font-semibold leading-tight sm:text-[11px] ${
                      terminados ? "text-gray-500" : "text-navy"
                    }`}
                    title={delDia[0].titulo}
                  >
                    {delDia[0].titulo}
                  </span>

                  <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-primary">
                    {delDia.length > 1 && <span>+{delDia.length - 1} más</span>}
                    {inscripto && (
                      <FaCircleCheck className="text-[11px] text-emerald-600" title="Estás inscripto" />
                    )}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda de referencias (mantenida y solicitada por el usuario) */}
      <div className="mt-3.5 flex flex-col gap-2 pt-1 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-primary" /> Evento programado
          </span>
          <span className="flex items-center gap-1.5">
            <FaCircleCheck className="text-emerald-600" /> Estás inscripto
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-gray-400" /> Finalizado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border-2 border-primary bg-white" /> Día de hoy
          </span>
        </div>

        <p className="text-[11px] text-gray-500">
          Tocá cualquier día con eventos para ver el detalle y gestionar tu inscripción.
        </p>
      </div>
    </div>
  );
}
