// ==========================================
// Descarga del comprobante PDF que ya está guardado en Cloudinary
// ==========================================
// Por qué existe: cuando se registra un pago se genera el comprobante y se sube a Cloudinary
// (campo urlComprobante). Antes, al descargarlo, siempre se volvía a generar desde cero, y el PDF
// podía salir distinto al original (por ejemplo, si el socio cambió su razón social). Para un
// comprobante lo correcto es entregar el MISMO archivo que se emitió; solo si ese archivo no está
// o no se puede traer, se regenera como plan B.
//
// Los comprobantes nuevos se guardan como privados ("authenticated"): para traerlos, el servidor pide una URL
// firmada que vence en pocos minutos (urlTemporalDeDescarga). Los subidos antes de ese cambio siguen públicos
// ("upload") y se piden con su URL de siempre. En los dos casos el PDF lo entrega el backend: la URL de
// Cloudinary ya no se le manda al navegador.

import { leerUrlDeCloudinary, urlTemporalDeDescarga } from './cloudinary.service.js';

// Solo se descarga de Cloudinary, por HTTPS. La URL sale de nuestra propia base, pero si algún día
// llegara a contener otra dirección (un dato mal cargado, por ejemplo), el servidor no debe salir a
// pedirla: sería una forma de usar nuestro backend para consultar sitios internos o ajenos.
// La URL guardada siempre es de res.cloudinary.com; la temporal de un archivo privado la arma el SDK de
// Cloudinary y apunta a su API (api.cloudinary.com). No se acepta ningún otro dominio.
export const esUrlDeCloudinary = (url) => {
  try {
    const destino = new URL(url);
    return destino.protocol === 'https:' && destino.hostname === 'res.cloudinary.com';
  } catch {
    return false;
  }
};

const esUrlDeLaApiDeCloudinary = (url) => {
  try {
    const destino = new URL(url);
    return destino.protocol === 'https:' && destino.hostname === 'api.cloudinary.com';
  } catch {
    return false;
  }
};

// Un pago tal como se le devuelve al frontend: sin la URL de Cloudinary del comprobante y con
// tieneComprobante. La URL no se manda porque el comprobante es privado (tiene CUIT y monto) y se descarga
// siempre a través del backend, que verifica quién lo pide. tieneComprobante es true para todo pago
// registrado: si el PDF guardado no está (todavía se está subiendo, o la subida falló), la descarga lo
// regenera, así que siempre se puede descargar. Sirve para mostrar el botón sin depender de la URL.
export const pagoSinUrlDeComprobante = (pago) => {
  if (!pago) return pago;
  const { urlComprobante, ...resto } = typeof pago.toJSON === 'function' ? pago.toJSON() : pago;
  return { ...resto, tieneComprobante: true };
};

const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024; // un comprobante pesa unos KB; 10 MB es un tope holgado

// Devuelve un Buffer con el PDF, o null si no se pudo (sin URL, URL no permitida, Cloudinary caído,
// archivo que no es PDF). Nunca lanza error: el que la llama decide qué hacer con el null.
// fetchFn se puede reemplazar en los tests para no salir a internet.
// urlTemporalFn se puede reemplazar en los tests (por defecto, la firma real del SDK).
export const descargarPdfGuardado = async (url, { fetchFn = fetch, tiempoMaximoMs = 10000, urlTemporalFn } = {}) => {
  if (!url || !esUrlDeCloudinary(url)) return null;

  try {
    // Archivo privado: se pide con una URL firmada que vence en minutos. Archivo público viejo: con su URL.
    const esPrivado = leerUrlDeCloudinary(url)?.tipoEntrega === 'authenticated';
    // La función de firma se resuelve acá adentro (y no como valor por defecto del parámetro) para que, si
    // fallara, quede dentro del try: esta función promete no lanzar nunca.
    const urlDescarga = esPrivado ? (urlTemporalFn ?? urlTemporalDeDescarga)(url) : url;
    if (!urlDescarga || !(esUrlDeCloudinary(urlDescarga) || esUrlDeLaApiDeCloudinary(urlDescarga))) return null;

    const respuesta = await fetchFn(urlDescarga, {
      signal: AbortSignal.timeout(tiempoMaximoMs), // si Cloudinary no responde, no dejamos colgado al socio
      redirect: 'error',                           // no seguimos redirecciones a otros sitios
    });
    if (!respuesta.ok) return null;

    const buffer = Buffer.from(await respuesta.arrayBuffer());
    if (buffer.length === 0 || buffer.length > TAMANO_MAXIMO_BYTES) return null;

    // No se confía en el Content-Type (Cloudinary puede entregar los PDF "raw" como octet-stream):
    // se mira que el archivo empiece con la firma de un PDF.
    if (buffer.subarray(0, 4).toString('latin1') !== '%PDF') return null;

    return buffer;
  } catch (error) {
    console.error('No se pudo traer el comprobante guardado en Cloudinary:', error.message);
    return null;
  }
};
