// ==========================================
// Manejo global de errores y de rutas inexistentes
// ==========================================
// Por qué existe: sin un manejador propio, Express responde los errores con una página HTML que
// incluye el STACK TRACE y las rutas de archivos del servidor (por ejemplo "C:\Users\...\app.js").
// Eso le regala a un atacante información de cómo está armado el sistema. Las pruebas de seguridad
// lo detectaron en: JSON mal formado, cuerpos demasiado grandes, archivos rechazados por multer y
// el rechazo de CORS.
// Acá todos esos casos responden con el mismo formato del resto de la API ({ exito, mensaje }),
// con el código HTTP que corresponde y sin detalles internos. El detalle completo se registra
// solo en la consola del servidor.

// Va DESPUÉS de todas las rutas: cualquier URL que no coincida con ninguna cae acá.
export const rutaNoEncontrada = (req, res) => {
  res.status(404).json({ exito: false, mensaje: 'Ruta no encontrada.' });
};

// Express reconoce un manejador de errores por tener EXACTAMENTE 4 parámetros: no se puede quitar "next".
// Va al final de todo, después de rutaNoEncontrada.
export const manejadorErrores = (err, req, res, next) => {
  // Si ya se empezó a enviar la respuesta no se puede cambiar: se delega al manejador por defecto.
  if (res.headersSent) return next(err);

  // JSON mal formado en el cuerpo de la petición.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ exito: false, mensaje: 'El cuerpo de la petición no es un JSON válido.' });
  }

  // Cuerpo demasiado grande.
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ exito: false, mensaje: 'El cuerpo de la petición es demasiado grande.' });
  }

  // Errores de subida de archivos (multer): tamaño máximo, demasiados archivos, campo inesperado, etc.
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ exito: false, mensaje: 'El archivo supera el tamaño máximo permitido.' });
    }
    return res.status(400).json({ exito: false, mensaje: 'No se pudo procesar el archivo subido.' });
  }

  // Archivo rechazado por el filtro de formato (los mensajes ya están pensados para el usuario,
  // por ejemplo "Formato de imagen inválido. Solo se permiten archivos JPG, JPEG, PNG o WEBP.").
  if (typeof err.message === 'string' && err.message.startsWith('Formato')) {
    return res.status(400).json({ exito: false, mensaje: err.message });
  }

  // Origen no permitido por CORS.
  if (err.message === 'Bloqueado por CORS') {
    return res.status(403).json({ exito: false, mensaje: 'Origen no permitido.' });
  }

  // Cualquier otro error del cliente que Express ya haya clasificado (4xx): se responde sin detalles.
  const estado = err.status || err.statusCode;
  if (estado >= 400 && estado < 500) {
    return res.status(estado).json({ exito: false, mensaje: 'Petición inválida.' });
  }

  // Error inesperado del servidor: el detalle queda en el log, nunca en la respuesta.
  console.error('Error no controlado:', err);
  res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
};
