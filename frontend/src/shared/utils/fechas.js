import dayjs from "dayjs";
import "dayjs/locale/es";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrAfter);
dayjs.locale("es");

export default dayjs;

export const ZONA_HORARIA_ARGENTINA = "America/Argentina/Buenos_Aires";

/** Fecha actual de calendario en hora argentina ("YYYY-MM-DD"). */
export const fechaHoyArgentina = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA_ARGENTINA });

/**
 * Formatea una fecha sin hora ("2026-11-05") sin corrimiento de zona horaria,
 * o un momento con hora en zona horaria argentina → "05/11/2026".
 */
export function formatearFecha(fecha) {
  if (!fecha) return "Fecha no disponible";
  const texto = String(fecha).trim();
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (soloFecha) return `${soloFecha[3]}/${soloFecha[2]}/${soloFecha[1]}`;

  const momento = new Date(texto);
  if (Number.isNaN(momento.getTime())) return "Fecha no disponible";
  return momento.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: ZONA_HORARIA_ARGENTINA,
  });
}

/** "2026-10-23" → "viernes 23 de octubre, 2026" */
export const formatearFechaLarga = (fecha) =>
  fecha && dayjs(fecha).isValid()
    ? dayjs(fecha).format("dddd D [de] MMMM, YYYY")
    : "Fecha no disponible";
