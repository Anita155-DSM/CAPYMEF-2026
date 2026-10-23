import dayjs from "@/shared/utils/fechas";

/** Texto legible: "Viernes 5, 9:00 am hasta Sábado 6, 1:00 am". */
export function resumenHorario(fecha, horaInicio, horaFin) {
  if (!fecha) return "Seleccioná una fecha para ver el resumen.";

  const dia = dayjs(fecha);
  let texto = dia.format("dddd D");

  if (horaInicio) {
    const [hI, mI] = horaInicio.split(":");
    const inicio = dia.hour(hI).minute(mI);
    texto += `, ${inicio.format("h:mm a")}`;

    if (horaFin) {
      const [hF, mF] = horaFin.split(":");
      let fin = dia.hour(hF).minute(mF);
      if (fin.isBefore(inicio)) fin = fin.add(1, "day"); // termina pasada la medianoche
      texto += ` hasta ${fin.format("dddd D, h:mm a")}`;
    }
  }
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
