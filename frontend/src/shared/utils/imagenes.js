const UPLOADS_URL = import.meta.env.VITE_API_URL_UPLOADS;

/**
 * Devuelve la URL lista para un <img>:
 *   - "https://res.cloudinary.com/..." → la deja igual
 *   - "noticias/foto.jpg"              → http://host/noticias/foto.jpg
 *   - null / ""                        → null
 */
export function urlImagen(ruta) {
    if (!ruta) return null;
    if (/^https?:\/\//.test(ruta)) return ruta;
    return `${UPLOADS_URL}/${ruta}`;
}