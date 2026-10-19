import { useMemo } from "react";
import { FaChevronLeft, FaChevronRight, FaCircleCheck } from "react-icons/fa6";
import dayjs from "@/shared/utils/fechas";
import { yaTermino } from "../utils/eventos";

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/**
 * Grilla mensual. `mes` es un dayjs al día 1 del mes visible.
 * Marca el día de hoy, los días con eventos (gris si ya terminaron), cuántos eventos hay
 * cuando son más de uno y una tilde si el socio está inscripto.
 */
export default function CalendarioEventos({ mes, onCambiarMes, eventos, onSeleccionar }) {
  // Celdas: huecos hasta el primer lunes + días del mes
  const celdas = useMemo(() => {
    const huecos = (mes.day() + 6) % 7;
    return [...Array(huecos).fill(null), ...Array.from({ length: mes.daysInMonth() }, (_, i) => i + 1)];
  }, [mes]);

  const eventosDelDia = (dia) => {
    if (!dia) return [];
    const fecha = mes.date(dia).format("YYYY-MM-DD");
    return eventos.filter((e) => e.fecha && e.fecha.split("T")[0] === fecha);
  };

  const hoy = dayjs();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between border-b-4 border-[#0875b1] pb-2 text-[#0875b1]">
        <button type="button" aria-label="Mes anterior" onClick={() => onCambiarMes(mes.subtract(1, "month"))} className="rounded-lg p-2 hover:bg-white">
          <FaChevronLeft />
        </button>
        <h2 className="text-2xl uppercase">{mes.format("MMMM")}</h2>
        <div className="flex items-center gap-4">
          <span className="text-2xl">{mes.format("YYYY")}</span>
          <button type="button" aria-label="Mes siguiente" onClick={() => onCambiarMes(mes.add(1, "month"))} className="rounded-lg p-2 hover:bg-white">
            <FaChevronRight />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 pt-5 text-center text-sm font-bold text-[#0063a7]">
        {diasSemana.map((d) => <span key={d}>{d}</span>)}
      </div>

      <div className="grid grid-cols-7 border-b-4 border-[#0875b1] pb-7 pt-3">
        {celdas.map((dia, i) => {
          const delDia = eventosDelDia(dia);
          const esHoy = Boolean(dia) && mes.date(dia).isSame(hoy, "day");
          const terminados = delDia.length > 0 && delDia.every(yaTermino);
          const inscripto = delDia.some((e) => e.yaInscripto);

          let claseDia = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#073d6f]";
          if (delDia.length) claseDia = `flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-white ${terminados ? "bg-gray-400" : "bg-[#5aa8d5]"}`;
          if (esHoy) claseDia += " ring-2 ring-[#0875b1] ring-offset-2 ring-offset-surface";

          return (
            <button
              type="button"
              key={`${dia || "vacio"}-${i}`}
              disabled={!dia}
              onClick={() => delDia[0] && onSeleccionar(delDia[0])}
              aria-label={dia ? `${dia} de ${mes.format("MMMM")}${delDia.length ? `: ${delDia.map((e) => e.titulo).join(", ")}` : ""}${esHoy ? " (hoy)" : ""}` : undefined}
              className={`flex min-h-[100px] flex-col items-center justify-start px-1 pt-2 text-sm ${dia ? "rounded-lg transition-colors hover:bg-white/60" : "cursor-default"}`}
            >
              <span className={claseDia}>{dia || ""}</span>
              {delDia.length > 0 && (
                <>
                  <span className={`mt-1 w-full text-[10px] font-medium leading-tight line-clamp-2 ${terminados ? "text-gray-500" : "text-[#073d6f]"}`} title={delDia[0].titulo}>
                    {delDia[0].titulo}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-[#0875b1]">
                    {delDia.length > 1 && <span>+{delDia.length - 1} más</span>}
                    {inscripto && <FaCircleCheck className="text-[#247c5c]" title="Estás inscripto" />}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {!eventos.length && <p className="py-8 text-center text-sm text-gray-600">No hay eventos publicados.</p>}
    </div>
  );
}