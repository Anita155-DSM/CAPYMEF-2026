// ==========================================
// Privacidad del link de los eventos virtuales
// ==========================================
// Por qué existe: en un evento virtual, el campo `lugar` guarda el link de la reunión (Meet, Zoom...).
// Antes la API se lo devolvía a cualquiera, incluso sin login (GET /eventos/publicos y /eventos/:id), y
// el frontend solo lo escondía en pantalla: cualquiera que mirara la respuesta podía entrar a la reunión.
// Ahora el link solo se entrega a un admin o a quien está inscripto en ese evento. En los eventos
// presenciales `lugar` es una dirección pública y no cambia nada.

// Modalidades cuyo `lugar` es un link privado. Es el único lugar donde se decide: si se agrega
// 'hibrido', alcanza con sumarla acá.
const MODALIDADES_CON_ENLACE_PRIVADO = new Set(['virtual']);

export const tieneEnlacePrivado = (evento) => MODALIDADES_CON_ENLACE_PRIVADO.has(evento?.modalidad);

// Recibe un evento ya convertido a objeto plano (evento.toJSON()) y devuelve una copia con `lugar: null`
// si el link es privado y quien consulta no puede verlo. Nunca modifica el objeto recibido.
export const ocultarLugarSiCorresponde = (evento, puedeVerEnlace) =>
  tieneEnlacePrivado(evento) && !puedeVerEnlace ? { ...evento, lugar: null } : evento;
