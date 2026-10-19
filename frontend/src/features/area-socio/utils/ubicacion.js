// El admin guarda en `evento.lugar` una de estas cosas:
//   · un link de Google Maps con coordenadas   → https://www.google.com/maps?q=-26.18,-58.17
//   · una dirección escrita a mano             → "Av. 25 de Mayo 123, Formosa"
//   · un link de reunión (si es virtual)       → https://meet.google.com/…

const COORDENADAS = /(?:[?&]q=|@)(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/;

function leerCoordenadas(texto) {
  const m = COORDENADAS.exec(texto);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? `${lat},${lng}` : null;
}

const esUrl = (texto) => /^https?:\/\//i.test(texto);

/**
 * Datos para dibujar el mapa de un evento presencial.
 * Devuelve { embed, enlace } o null si no hay nada que mostrar en un mapa.
 *   embed  → URL del iframe
 *   enlace → URL para abrir "Cómo llegar" en Google Maps
 */
export function mapaDelEvento(evento) {
  const lugar = (evento?.lugar || "").trim();
  if (!lugar || evento?.modalidad === "virtual") return null;

  const consulta = leerCoordenadas(lugar) ?? (esUrl(lugar) ? null : encodeURIComponent(lugar));
  if (!consulta) return null; // link raro (ej. maps.app.goo.gl): no se puede embeber

  return {
    embed: `https://maps.google.com/maps?q=${consulta}&z=15&output=embed`,
    enlace: `https://www.google.com/maps/search/?api=1&query=${consulta}`,
  };
}
