// ==========================================
// Descarga del comprobante PDF que ya está guardado en Cloudinary
// ==========================================
// Por qué existe: cuando se registra un pago se genera el comprobante y se sube a Cloudinary
// (campo urlComprobante). Antes, al descargarlo, siempre se volvía a generar desde cero, y el PDF
// podía salir distinto al original (por ejemplo, si el socio cambió su razón social). Para un
// comprobante lo correcto es entregar el MISMO archivo que se emitió; solo si ese archivo no está
// o no se puede traer, se regenera como plan B.

// Solo se descarga de Cloudinary, por HTTPS. La URL sale de nuestra propia base, pero si algún día
// llegara a contener otra dirección (un dato mal cargado, por ejemplo), el servidor no debe salir a
// pedirla: sería una forma de usar nuestro backend para consultar sitios internos o ajenos.
export const esUrlDeCloudinary = (url) => {
  try {
    const destino = new URL(url);
    return destino.protocol === 'https:' && destino.hostname === 'res.cloudinary.com';
  } catch {
    return false;
  }
};

const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024; // un comprobante pesa unos KB; 10 MB es un tope holgado

// Devuelve un Buffer con el PDF, o null si no se pudo (sin URL, URL no permitida, Cloudinary caído,
// archivo que no es PDF). Nunca lanza error: el que la llama decide qué hacer con el null.
// fetchFn se puede reemplazar en los tests para no salir a internet.
export const descargarPdfGuardado = async (url, { fetchFn = fetch, tiempoMaximoMs = 10000 } = {}) => {
  if (!url || !esUrlDeCloudinary(url)) return null;

  try {
    const respuesta = await fetchFn(url, {
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
