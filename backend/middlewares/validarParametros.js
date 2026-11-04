// ==========================================
// Validación del formato de los ids que llegan en la URL
// ==========================================
// Por qué existe: si alguien pide /api/gastos/abc, Postgres no puede comparar "abc" con una columna
// UUID, la consulta falla y el servidor respondía 500 ("error interno") cuando en realidad el error
// es del cliente. Un 500 además ensucia los logs y se confunde con una falla real del sistema.
// Ahora el formato se revisa ANTES de tocar la base y se responde 400.
//
// Se usa con router.param, que se ejecuta automáticamente cada vez que la ruta tiene ese parámetro:
//   router.param('id', paramUuid);     // ids UUID (Cuota, Pago, Evento, Gasto, Notificacion...)
//   router.param('id', paramEntero);   // ids numéricos (User, Noticia)
// Así no hay que acordarse de agregar la validación ruta por ruta.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// El INTEGER de Postgres llega hasta 2147483647: un id mayor, aunque sea solo dígitos, también
// hace fallar la consulta ("out of range"), así que se rechaza igual.
const ENTERO_MAXIMO_POSTGRES = 2147483647;

const rechazar = (res) =>
  res.status(400).json({ exito: false, mensaje: 'El identificador recibido no es válido.' });

export const paramUuid = (req, res, next, valor) => {
  if (UUID.test(valor)) return next();
  return rechazar(res);
};

export const paramEntero = (req, res, next, valor) => {
  // Primero el formato (solo dígitos, máximo 10) y recién después se convierte a número.
  if (/^\d{1,10}$/.test(valor)) {
    const numero = Number(valor);
    if (numero >= 1 && numero <= ENTERO_MAXIMO_POSTGRES) return next();
  }
  return rechazar(res);
};
