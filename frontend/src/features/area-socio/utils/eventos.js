import dayjs from "@/shared/utils/fechas";

/** Solo se muestra como link un lugar https de un evento virtual (nunca "javascript:" ni similares). */
export function linkReunion(evento) {
  if (evento?.modalidad !== "virtual" || !evento.lugar) return null;
  try {
    const url = new URL(evento.lugar);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Datos de un evento para mostrar en el Inicio
// ---------------------------------------------------------------------------

/** Momento de inicio del evento (sin hora = 00:00) */
export const inicioDelEvento = (e) => dayjs(`${e.fecha}T${e.horaInicio || "00:00"}`);

/** Momento en que termina: hora de fin, si no la de inicio y, si tampoco hay hora, el final del día. */
export const finDelEvento = (e) => dayjs(`${e.fecha}T${e.horaFin || e.horaInicio || "23:59"}`);

/** "18:00:00" → "18:00" */
const hhmm = (hora) => String(hora || "").slice(0, 5);

export function textoHorario(e) {
  if (!e.horaInicio) return "Horario a confirmar";
  return e.horaFin ? `${hhmm(e.horaInicio)} a ${hhmm(e.horaFin)} hs` : `${hhmm(e.horaInicio)} hs`;
}

/** Link https (mapa o reunión). Cualquier otra cosa ("javascript:", etc.) devuelve null. */
function urlHttps(texto) {
  try {
    const url = new URL(texto);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

/** Lugar listo para mostrar: si es un link se muestra con un texto claro en vez de la URL cruda. */
export function describirLugar(evento) {
  const virtual = evento?.modalidad === "virtual";
  const href = evento?.lugar ? urlHttps(evento.lugar) : null;
  if (href) return { texto: virtual ? "Unirme a la reunión" : "Ver ubicación en el mapa", href };
  return { texto: evento?.lugar || (virtual ? "Reunión virtual" : "Lugar a confirmar"), href: null };
}

/**
 * Texto de cupos. `cupoDisponible` viene de GET /eventos/:id:
 *   undefined → todavía consultando, null → no se pudo saber, número → cupos que quedan.
 * Ojo: `cupoMaximo` es la capacidad TOTAL, no los cupos libres.
 */
export function textoCupos(evento, cupoDisponible) {
  if (evento.cupoMaximo == null) return "Cupo abierto";
  if (cupoDisponible === undefined) return "Consultando cupos...";
  if (cupoDisponible === null) return `${evento.cupoMaximo} cupos en total`;
  if (cupoDisponible <= 0) return "Cupos agotados";
  return `${cupoDisponible === 1 ? "Queda 1 cupo" : `Quedan ${cupoDisponible} cupos`} de ${evento.cupoMaximo}`;
}