// ==========================================
// ¿El pago que informa Mercado Pago corresponde de verdad a la cuota?
// ==========================================
// Por qué existe: el webhook ya consulta el pago real a Mercado Pago (un aviso inventado no marca nada),
// pero no comparaba el monto. Alguien podría pagar $1 con la referencia de una cuota de $10.000 (por
// ejemplo armando su propia orden de pago con esa external_reference) y la cuota quedaría pagada.
// Antes de dar una cuota por pagada se verifica que el pago:
//   - esté aprobado (status 'approved');
//   - sea en pesos (currency_id 'ARS'), como la orden que arma crearOrdenDePago;
//   - sea por EXACTAMENTE el monto de la cuota (la orden tiene un solo ítem, cantidad 1, a cuota.monto);
//   - tenga como referencia esa misma cuota.
//
// Función pura: no consulta nada, recibe el pago ya normalizado (ver procesarNotificacionPago) y la cuota.

// Los montos se comparan en centavos enteros, nunca como números con decimales: cuota.monto es DECIMAL y
// puede llegar como texto ("10000.00"), y con decimales binarios 10.1 * 3 da 30.299999999999997.
// Devuelve null si el valor no es un monto válido.
export const aCentavos = (valor) => {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.round(numero * 100) : null;
};

// pagoMP: { estado, moneda, montoPagado, cuotaId } · cuota: { id, monto }
// Devuelve { valido, motivos }: motivos son textos para el log y el aviso a los admins (sin datos personales).
export const validarPagoContraCuota = (pagoMP, cuota) => {
  const motivos = [];

  if (pagoMP?.estado !== 'approved') motivos.push(`el pago no está aprobado (estado ${pagoMP?.estado ?? 'desconocido'})`);
  if (pagoMP?.moneda !== 'ARS') motivos.push(`la moneda no es pesos (${pagoMP?.moneda ?? 'sin moneda'})`);

  const esperado = aCentavos(cuota?.monto);
  const recibido = aCentavos(pagoMP?.montoPagado);
  if (esperado === null || recibido === null || esperado !== recibido) {
    motivos.push('el monto no coincide con el de la cuota');
  }

  if (!cuota?.id || String(pagoMP?.cuotaId ?? '') !== String(cuota.id)) {
    motivos.push('la referencia no corresponde a esta cuota');
  }

  return { valido: motivos.length === 0, motivos };
};
