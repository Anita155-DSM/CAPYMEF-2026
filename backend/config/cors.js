// ==========================================
// Orígenes permitidos por CORS (quién puede llamar a la API desde un navegador)
// ==========================================
// Por qué existe: antes la lista estaba escrita a mano en app.js con solo 'http://localhost:5173'. En
// producción eso dejaba afuera al frontend real (había que acordarse de editar el código para publicar) y
// seguía aceptando a localhost, que ahí no tiene sentido. Ahora el origen sale de FRONTEND_URL, y
// localhost solo se agrega en desarrollo.

const FRONTEND_LOCAL = 'http://localhost:5173';
const HOSTS_LOCALES = new Set(['localhost', '127.0.0.1', '[::1]']);

// Un navegador manda en el encabezado Origin solo "esquema://host:puerto", sin ruta ni barra final. Por
// eso FRONTEND_URL se reduce a eso: si en el .env quedó "https://capymef.org.ar/" o con una ruta, igual
// coincide. Devuelve null si el valor no es una dirección http(s) válida.
const origenDe = (url) => {
  if (typeof url !== 'string' || url.trim() === '') return null;
  try {
    const destino = new URL(url.trim());
    return ['http:', 'https:'].includes(destino.protocol) ? destino.origin : null;
  } catch {
    return null;
  }
};

const esLocal = (origen) => HOSTS_LOCALES.has(new URL(origen).hostname);

// Función pura: recibe todo por parámetro (no lee process.env) y nunca lanza excepciones.
// - Incluye el origen de FRONTEND_URL si es válido.
// - En desarrollo agrega además el frontend local de Vite.
// - En producción NUNCA incluye localhost ni 127.0.0.1, aunque FRONTEND_URL apunte ahí por error.
export const armarDominiosPermitidos = (opciones) => {
  // Con null u otro valor raro (no solo undefined) se toma como "sin opciones": desarrollo y sin FRONTEND_URL.
  const { frontendUrl, produccion = false } = opciones && typeof opciones === 'object' ? opciones : {};
  const dominios = new Set();

  const origenFrontend = origenDe(frontendUrl);
  if (origenFrontend && !(produccion && esLocal(origenFrontend))) dominios.add(origenFrontend);

  if (!produccion) dominios.add(FRONTEND_LOCAL);

  return [...dominios];
};
