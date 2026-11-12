// ==========================================
// Middleware: verifica que el aviso del webhook venga de Mercado Pago
// ==========================================
// Por qué hay modos (variable MP_WEBHOOK_MODE): si la firma se exigiera de golpe y algo estuviera
// mal configurado (el secreto equivocado, o algún tipo de aviso que Mercado Pago mande sin firma),
// se rechazarían pagos reales sin que nadie lo note. Con los modos se puede activar en etapas:
//   - 'off' (o sin definir): no verifica nada, como antes.
//   - 'log': verifica y escribe el resultado en la consola, pero deja pasar siempre. Sirve para
//            confirmar con avisos reales que las firmas dan "ok" antes de exigirlas.
//   - 'enforce': rechaza con 401 los avisos sin firma válida.
//     Excepción: los avisos de un tema distinto de 'payment' (por ejemplo merchant_order) se
//     responden 200 sin exigir firma y sin pasar al controlador. Mercado Pago los manda en el
//     formato viejo (?id=...&topic=...) y SIN x-signature; el controlador ya los ignora, así que
//     exigirles firma no protege nada, y un 401 haría que Mercado Pago los reintente sin fin.
//     Los avisos de 'payment' (o sin tema) siempre necesitan firma válida.
// Cualquier otro valor se trata como 'enforce': ante un error de tipeo en la configuración es más
// seguro rechazar (fallar cerrado) que dejar el webhook abierto sin que nadie se dé cuenta.
//
// El modo y el secreto se leen en cada aviso (no al cargar el archivo) para que un cambio en el
// entorno valga sin depender del orden en que se importan los módulos.

import { verificarFirmaMercadoPago } from '../services/firmaWebhook.service.js';

const leerModo = () => {
  const modo = (process.env.MP_WEBHOOK_MODE ?? '').trim().toLowerCase();
  if (modo === '' || modo === 'off') return 'off';
  if (modo === 'log') return 'log';
  return 'enforce';
};

export const verificarOrigenWebhook = (req, res, next) => {
  const modo = leerModo();
  if (modo === 'off') return next();

  // Mismo cálculo del tema que el controlador (recibirWebhook), para que los dos decidan igual.
  const topic = req.query.topic || req.query.type || req.body?.type;
  if (modo === 'enforce' && topic && topic !== 'payment') {
    // Se reconoce y se ignora, como hace el controlador: no se llama a next().
    return res.status(200).json({ recibido: true });
  }

  // El id del recurso viene en la query (?data.id=...); el cuerpo es solo un respaldo.
  const resultado = verificarFirmaMercadoPago({
    firma: req.get('x-signature'),
    requestId: req.get('x-request-id'),
    dataId: req.query['data.id'] ?? req.body?.data?.id,
    secreto: process.env.MP_WEBHOOK_SECRET,
  });

  // En la consola va solo el motivo: nunca el secreto ni la firma, que permitirían falsificar avisos.
  if (modo === 'log') {
    console.log(`[webhook Mercado Pago] verificación de firma: ${resultado.motivo} (modo log: se deja pasar)`);
    return next();
  }

  // En 'enforce' también se rechaza si falta el secreto: un error de configuración no puede
  // terminar dejando el webhook abierto.
  if (resultado.valida) return next();

  console.warn(`[webhook Mercado Pago] aviso rechazado: ${resultado.motivo}`);
  return res.status(401).json({ exito: false, mensaje: 'Firma no válida.' });
};
