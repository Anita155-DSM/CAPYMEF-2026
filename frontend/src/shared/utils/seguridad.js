// Helpers de seguridad y descarga que usan varias features.

/**
 * Nunca redirigimos ni abrimos una URL que venga del servidor sin chequear
 * protocolo y dominio (evita open-redirects y esquemas tipo "javascript:").
 * Devuelve un objeto URL o null.
 *   urlSegura(link, /(^|\.)mercadopago\.com$/i)
 */
export function urlSegura(valor, dominioPermitido) {
  try {
    const url = new URL(valor);
    return url.protocol === "https:" && dominioPermitido.test(url.hostname) ? url : null;
  } catch {
    return null;
  }
}

/** Ids que se arman dentro de una ruta: solo letras, números, "_" y "-". */
export const idValido = (id) => /^[\w-]{1,64}$/.test(String(id ?? ""));

export const nombreArchivoSeguro = (texto) =>
  String(texto || "archivo").replace(/[^\w.-]+/g, "_").slice(0, 80);

/** Dispara la descarga de un Blob con el nombre indicado. */
export function descargarBlob(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
