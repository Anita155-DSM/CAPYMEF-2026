import { useMemo } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

/** Grilla mensual. `mes` es un dayjs al día 1 del mes visible. */
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

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between border-b-4 border-[#0875b1] pb-2 text-[#0875b1]">
        <button type="button" aria-label="Mes anterior" onClick={() => onCambiarMes(mes.subtract(1, "month"))} className="p-2 hover:bg-white">
          <FaChevronLeft />
        </button>
        <h2 className="text-2xl uppercase">{mes.format("MMMM")}</h2>
        <div className="flex items-center gap-4">
          <span className="text-2xl">{mes.format("YYYY")}</span>
          <button type="button" aria-label="Mes siguiente" onClick={() => onCambiarMes(mes.add(1, "month"))} className="p-2 hover:bg-white">
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
          return (
            <button
              type="button"
              key={`${dia || "vacio"}-${i}`}
              disabled={!dia}
              onClick={() => delDia[0] && onSeleccionar(delDia[0])}
              className={`flex flex-col min-h-[100px] items-center justify-start pt-2 px-1 text-sm ${dia ? "hover:bg-white/60 transition-colors" : "cursor-default"}`}
            >
              <span className={delDia.length ? "flex h-8 w-8 items-center justify-center rounded-full bg-[#5aa8d5] font-bold text-white shrink-0" : "flex h-8 items-center text-[#073d6f] shrink-0"}>
                {dia || ""}
              </span>
              {delDia.length > 0 && (
                <span className="mt-1 w-full text-[10px] leading-tight text-[#073d6f] font-medium line-clamp-2" title={delDia[0].titulo}>
                  {delDia[0].titulo}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!eventos.length && <p className="py-8 text-center text-sm text-gray-600">No hay eventos publicados.</p>}
    </div>
  );
}
