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
