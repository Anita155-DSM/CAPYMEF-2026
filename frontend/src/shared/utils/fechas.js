import dayjs from "dayjs";
import "dayjs/locale/es";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isSameOrAfter);
dayjs.locale("es");

export default dayjs;

/** "2026-10-14T00:00:00Z" → "14/10/2026" */
export const formatearFecha = (fecha) =>
    fecha ? dayjs(fecha).format("DD/MM/YYYY") : "Fecha no disponible";