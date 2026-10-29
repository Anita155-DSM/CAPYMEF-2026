import dayjs from "dayjs";
import "dayjs/locale/es";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrAfter);
dayjs.locale("es");

export default dayjs;

/** "2026-10-14T00:00:00Z" → "14/10/2026" */
export const formatearFecha = (fecha) =>
  fecha ? dayjs(fecha).format("DD/MM/YYYY") : "Fecha no disponible";

/** "2026-10-23T00:00:00Z" → "viernes 23 de octubre, 2026" */
export const formatearFechaLarga = (fecha) =>
  fecha && dayjs(fecha).isValid()
    ? dayjs(fecha).format("dddd D [de] MMMM, YYYY")
    : "Fecha no disponible";
