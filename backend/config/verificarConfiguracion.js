// ==========================================
// Chequeo de la configuración (variables de entorno) al arrancar el backend
// ==========================================
// Por qué existe: una variable faltante o mal puesta no avisa nada hasta que se usa. Por ejemplo, sin
// MP_WEBHOOK_SECRET el webhook rechaza todos los pagos, y con PAGO_RETORNO_VIA_BACKEND en 'true' el
// socio vuelve de Mercado Pago a una ruta pensada para desarrollo. Esos errores aparecían en medio de un
// pago real. Con este chequeo se descubren al iniciar: en producción el servidor directamente no
// arranca, y en desarrollo se muestran como avisos.
//
// Regla de oro: los mensajes nombran la VARIABLE, nunca su valor. Los logs del servidor los puede leer
// más gente que la que debería ver una clave.

// Sin estas el sistema no funciona en producción (base de datos, sesiones, pagos y direcciones públicas).
// MP_WEBHOOK_SECRET y MP_WEBHOOK_MODE tienen reglas propias más abajo.
export const VARIABLES_OBLIGATORIAS = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_DATABASE',
  'JWT_SECRET',
  'FRONTEND_URL',
  'BACKEND_URL',
  'MERCADOPAGO_ACCESS_TOKEN',
];

// Servicios externos que también son obligatorios en producción. Antes eran solo un aviso, pero sin
// ellos se rompen funciones centrales: sin Cloudinary falla el REGISTRO de socios (la constancia se sube
// ahí) y sin SMTP no hay recuperación de contraseña ni mail del comprobante de pago. Como el resto de las
// obligatorias, en desarrollo son solo un aviso (para poder trabajar sin configurar todo).
// Las que tienen un valor por defecto razonable (PORT, DB_PORT, SMTP_PORT, EMAIL_FROM, DB_SSL) no avisan.
const SIN_MAIL = 'no se van a poder enviar mails (recuperación de contraseña, comprobantes de pago)';
const SIN_ARCHIVOS = 'no se van a poder subir archivos (registro de socios, imágenes, comprobantes)';
export const SERVICIOS_OBLIGATORIOS = {
  SMTP_HOST: SIN_MAIL,
  SMTP_USER: SIN_MAIL,
  SMTP_PASS: SIN_MAIL,
  CLOUDINARY_CLOUD_NAME: SIN_ARCHIVOS,
  CLOUDINARY_API_KEY: SIN_ARCHIVOS,
  CLOUDINARY_API_SECRET: SIN_ARCHIVOS,
};

const LARGO_MINIMO_JWT_SECRET = 32;

// Una variable "falta" si no está, o si está vacía o con solo espacios (MP_WEBHOOK_SECRET= en el .env).
const falta = (valor) => typeof valor !== 'string' || valor.trim() === '';

// Función pura: recibe el entorno por parámetro (no lee process.env) para poder probarla sin tocar
// nada real. Nunca lanza excepciones con entradas raras.
// En producción las reglas incumplidas son errores; en desarrollo, las mismas reglas son avisos.
export const evaluarConfiguracion = (entorno, opciones) => {
  // Con opciones null u otro valor raro (no solo undefined) se toma como desarrollo.
  const produccion = Boolean(opciones && typeof opciones === 'object' && opciones.produccion);
  const env = entorno && typeof entorno === 'object' ? entorno : {};
  const errores = [];
  const avisos = [];
  const reglaIncumplida = (mensaje) => {
    if (produccion) errores.push(mensaje);
    else avisos.push(`${mensaje} (en producción impediría arrancar)`);
  };

  for (const nombre of VARIABLES_OBLIGATORIAS) {
    if (falta(env[nombre])) reglaIncumplida(`Falta la variable obligatoria ${nombre}.`);
  }

  // Las reglas siguientes solo miran variables que SÍ están: si falta, ya se informó arriba.
  if (!falta(env.JWT_SECRET) && env.JWT_SECRET.length < LARGO_MINIMO_JWT_SECRET) {
    reglaIncumplida(`JWT_SECRET tiene menos de ${LARGO_MINIMO_JWT_SECRET} caracteres: es demasiado corta para firmar sesiones.`);
  }

  // Igual que el middleware de firma: el modo se compara sin mayúsculas ni espacios.
  const modoWebhook = typeof env.MP_WEBHOOK_MODE === 'string' ? env.MP_WEBHOOK_MODE.trim().toLowerCase() : '';
  if (modoWebhook !== 'enforce') {
    reglaIncumplida("MP_WEBHOOK_MODE no es 'enforce': el webhook de pagos aceptaría avisos sin firma válida.");
  }
  if (falta(env.MP_WEBHOOK_SECRET)) {
    reglaIncumplida('Falta MP_WEBHOOK_SECRET: no se puede verificar la firma de los avisos de Mercado Pago.');
  }

  if (env.PAGO_RETORNO_VIA_BACKEND === 'true') {
    reglaIncumplida("PAGO_RETORNO_VIA_BACKEND está en 'true': eso es solo para desarrollo local.");
  }

  for (const nombre of ['BACKEND_URL', 'FRONTEND_URL']) {
    if (!falta(env[nombre]) && !env[nombre].trim().startsWith('https://')) {
      reglaIncumplida(`${nombre} no empieza con https://.`);
    }
  }

  for (const [nombre, efecto] of Object.entries(SERVICIOS_OBLIGATORIOS)) {
    if (falta(env[nombre])) reglaIncumplida(`Falta la variable obligatoria ${nombre}: ${efecto}.`);
  }

  // Términos y condiciones (ver config/terminos.js): mientras el frontend no mande aceptaTerminos, la exigencia
  // va apagada a propósito (modo transitorio). Por eso es un AVISO y no un error: tenerla apagada es una decisión
  // válida y no tiene que impedir el arranque. Solo en producción: en desarrollo es lo normal.
  // Se compara igual que terminosObligatorios(): solo el texto exacto 'true' la activa.
  if (produccion && env.TERMINOS_OBLIGATORIOS !== 'true') {
    avisos.push("TERMINOS_OBLIGATORIOS no está en 'true': el registro de socios no exige aceptar los términos y condiciones (activarla cuando el frontend mande aceptaTerminos).");
  }

  return { errores, avisos };
};

// Se llama al arrancar el servidor (startServer en app.js).
// En producción, con errores, el proceso termina: es mejor no arrancar que fallar en medio de un pago.
// En los tests no hace nada: ahí la configuración es de mentira a propósito.
export const verificarConfiguracion = () => {
  if (process.env.NODE_ENV === 'test') return;

  const produccion = process.env.NODE_ENV === 'production';
  const { errores, avisos } = evaluarConfiguracion(process.env, { produccion });

  for (const aviso of avisos) console.warn(`[configuración] Aviso: ${aviso}`);

  if (errores.length > 0) {
    for (const error of errores) console.error(`[configuración] Error: ${error}`);
    console.error(`[configuración] El servidor no arranca: hay ${errores.length} error(es) en las variables de entorno.`);
    process.exit(1);
  }
};
