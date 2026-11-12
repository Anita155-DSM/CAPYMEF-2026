// ==========================================
// Formato de fechas para textos que ve el usuario (constancias, certificados, mails)
// ==========================================
// Por qué existe: el servidor no fija una zona horaria, y `new Date(x).toLocaleDateString('es-AR')`
// usa la de la máquina donde corre. Eso daba dos errores:
//   1) Una fecha SIN hora ("2026-11-05", columnas DATEONLY como fechaPago o la fecha de un evento) se
//      interpreta como medianoche UTC; en una máquina con hora argentina eso es el día anterior a las
//      21:00, y la constancia decía "4/11/2026" para un pago del 5.
//   2) Un momento con hora (por ejemplo "generado el ...") salía en la hora del servidor: en un hosting
//      en UTC, 3 horas adelantado (y hasta con otra fecha cerca de la medianoche).
// Regla: una fecha sin hora se formatea tal cual es, sin pasar por ninguna zona horaria; un momento con
// hora se muestra siempre en hora argentina. No cambia cómo se guardan las fechas en la base.

export const ZONA_HORARIA_ARGENTINA = 'America/Argentina/Buenos_Aires';

// Lo que se muestra cuando no hay fecha o no es válida (igual que el frontend): nunca "Invalid Date".
export const SIN_FECHA = '-';

// Hora actual en Argentina como "HH:MM" (24 h), esté donde esté el servidor. Es el mismo formato en que se
// guardan horaInicio y horaFin de los eventos, así que se pueden comparar como texto ("09:30" < "18:00").
// hourCycle 'h23' evita que la medianoche salga como "24:00".
export const horaActualArgentina = (momento = new Date()) =>
  momento.toLocaleTimeString('en-GB', { timeZone: ZONA_HORARIA_ARGENTINA, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

const FECHA_SIN_HORA = /^(\d{4})-(\d{2})-(\d{2})$/;

// Fecha de calendario de un texto "YYYY-MM-DD", o null si no es una fecha real (2026-02-30, etc.).
const leerFechaSinHora = (texto) => {
  const partes = FECHA_SIN_HORA.exec(texto);
  if (!partes) return null;
  const [, anio, mes, dia] = partes.map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia ? fecha : null;
};

// valor: "YYYY-MM-DD" (fecha sin hora), o un Date / timestamp / texto ISO con hora.
// opciones: las de Intl (por defecto día/mes/año numéricos: "5/11/2026").
// Ejemplo para el certificado: { day: 'numeric', month: 'long', year: 'numeric' } -> "5 de noviembre de 2026".
export const formatearFechaArgentina = (valor, opciones = {}) => {
  if (valor === null || valor === undefined || valor === '') return SIN_FECHA;

  // Fecha sin hora: se arma ese mismo día en UTC y se formatea en UTC, así ninguna zona horaria la corre.
  if (typeof valor === 'string' && FECHA_SIN_HORA.test(valor)) {
    const dia = leerFechaSinHora(valor);
    return dia ? dia.toLocaleDateString('es-AR', { ...opciones, timeZone: 'UTC' }) : SIN_FECHA;
  }

  // Momento con hora: siempre en hora argentina, esté donde esté el servidor.
  const momento = new Date(valor);
  if (Number.isNaN(momento.getTime())) return SIN_FECHA;
  return momento.toLocaleDateString('es-AR', { ...opciones, timeZone: ZONA_HORARIA_ARGENTINA });
};

// Fecha y hora (24 h) en hora argentina: "4/11/2026, 23:00".
// toLocaleString('es-AR') sin opciones daba la hora en formato de 12 h sin "a. m./p. m." ("11:00:00").
export const formatearFechaHoraArgentina = (valor) => {
  const momento = valor instanceof Date ? valor : new Date(valor);
  if (valor === null || valor === undefined || Number.isNaN(momento.getTime())) return SIN_FECHA;
  return momento.toLocaleString('es-AR', {
    timeZone: ZONA_HORARIA_ARGENTINA,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
};
