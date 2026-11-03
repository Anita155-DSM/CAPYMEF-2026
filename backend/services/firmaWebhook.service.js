// ==========================================
// Verificación de la firma de los avisos (webhooks) de Mercado Pago
// ==========================================
// Por qué existe: POST /api/pagos/webhook no lleva token (lo llama el servidor de Mercado Pago),
// así que cualquiera que conozca la URL podría mandar un aviso falso. Mercado Pago firma cada aviso
// con un secreto que solo conocen ellos y nosotros (MP_WEBHOOK_SECRET): si la firma no coincide,
// el aviso no vino de Mercado Pago.
//
// Cómo firma Mercado Pago (documentación oficial):
//   - Encabezado x-signature: "ts=<milisegundos>,v1=<firma en hexadecimal>"
//   - Encabezado x-request-id
//   - Texto firmado: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" (con el ";" final)
//   - Firma: HMAC-SHA256 de ese texto con el secreto, en hexadecimal.
//
// No se pone límite de tiempo sobre "ts": Mercado Pago reintenta el mismo aviso durante días, y un
// límite haría rechazar avisos legítimos. Reenviar un aviso viejo tampoco sirve para atacar: el
// controlador consulta el pago real en Mercado Pago y no procesa dos veces la misma transacción.

import crypto from 'node:crypto';

const HEX = /^[0-9a-f]+$/i;

const esTextoConValor = (valor) => typeof valor === 'string' && valor.trim() !== '';
const faltaValor = (valor) => valor === undefined || valor === null || valor === '';

// Lee "ts=...,v1=..." sin importar el orden ni los espacios. Devuelve null si falta alguno.
const leerEncabezadoFirma = (firma) => {
  const partes = {};
  for (const parte of firma.split(',')) {
    const posicion = parte.indexOf('=');
    if (posicion === -1) continue;
    partes[parte.slice(0, posicion).trim()] = parte.slice(posicion + 1).trim();
  }
  if (!partes.ts || !partes.v1) return null;
  return { ts: partes.ts, v1: partes.v1 };
};

const calcularFirma = (secreto, dataId, requestId, ts) =>
  crypto.createHmac('sha256', secreto).update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest();

// Compara en tiempo constante, para no dar pistas de cuántos caracteres de la firma acertó un
// atacante. timingSafeEqual lanza un error si los largos son distintos: por eso se mira antes.
const sonIguales = (a, b) => a.length === b.length && crypto.timingSafeEqual(a, b);

// Función pura: no lee variables de entorno ni la petición, recibe todo por parámetro.
// Nunca lanza excepciones: ante cualquier entrada rara responde { valida: false, motivo }.
export const verificarFirmaMercadoPago = ({ firma, requestId, dataId, secreto } = {}) => {
  try {
    if (!esTextoConValor(secreto)) return { valida: false, motivo: 'sin_secreto' };
    if (faltaValor(firma) || faltaValor(requestId) || faltaValor(dataId)) {
      return { valida: false, motivo: 'faltan_encabezados' };
    }

    // El id puede llegar como número si viene del cuerpo JSON; cualquier otro tipo es inválido.
    const idTexto = typeof dataId === 'number' ? String(dataId) : dataId;
    if (typeof firma !== 'string' || typeof requestId !== 'string' || typeof idTexto !== 'string') {
      return { valida: false, motivo: 'formato_invalido' };
    }

    const partes = leerEncabezadoFirma(firma);
    if (!partes || !HEX.test(partes.v1) || partes.v1.length % 2 !== 0) {
      return { valida: false, motivo: 'formato_invalido' };
    }
    const recibida = Buffer.from(partes.v1, 'hex');

    // La documentación no aclara si data.id se firma en minúsculas: se prueba tal cual llega y,
    // si no coincide, en minúsculas. Con que una coincida, el aviso es válido.
    const candidatos = [...new Set([idTexto, idTexto.toLowerCase()])];
    const coincide = candidatos.some((id) => sonIguales(recibida, calcularFirma(secreto, id, requestId, partes.ts)));

    return coincide ? { valida: true, motivo: 'ok' } : { valida: false, motivo: 'firma_incorrecta' };
  } catch {
    // No debería pasar, pero si algo inesperado falla, el aviso se considera no válido.
    return { valida: false, motivo: 'formato_invalido' };
  }
};
