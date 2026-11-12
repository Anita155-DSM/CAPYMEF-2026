// ==========================================
// Padrón de socios habilitados para votar en Asamblea (Estatuto, arts. 7° inc. e y 46°)
// ==========================================
// Por qué existe: para votar en una Asamblea el socio tiene que cumplir requisitos que hasta ahora se
// revisaban a mano. Acá se calculan con los datos del sistema, para una FECHA DE CORTE que se recibe por
// parámetro (normalmente el día de la Asamblea o el cierre del padrón).
//
// Requisitos para estar habilitado:
//   1) Ser socio: las cuentas de gestión (rol admin) no son socios y no aparecen en ninguna lista
//      (mismo filtro que la regla de cuotas, ver abonaCuota.service.js).
//   2) Cuenta aprobada: las cuentas pendientes, rechazadas o dadas de baja no aparecen en ninguna lista.
//   3) Categoría Activo.
//   4) Antigüedad de al menos 6 meses desde la aprobación hasta la fecha de corte.
//      BORDE: se cuenta por fecha de calendario (hora argentina). Si la aprobación fue el mismo día del
//      mes, 6 meses antes de la fecha de corte, los 6 meses están CUMPLIDOS y el socio está habilitado
//      ("al menos 6 meses"). Si el mes destino no tiene ese día (corte 31/08 → 28 o 29/02), se usa el
//      último día de ese mes.
//      Para los socios aprobados antes de que existiera fechaAprobacion se usa createdAt (la fecha de
//      registro) como aproximación: suele ser igual o un poco anterior a la aprobación real.
//   5) Cuotas al día: ninguna cuota impaga (pendiente o vencida) con vencimiento ANTERIOR a la fecha de
//      corte. Una cuota pendiente que todavía no venció no inhabilita. Se mira el vencimiento y no solo el
//      estado 'vencida', para que una fecha de corte futura (el día de la Asamblea) cuente también las
//      cuotas que van a estar vencidas para ese día aunque el cierre diario todavía no las haya marcado.
//      Limitación: con una fecha de corte pasada, una cuota que se pagó después del corte ya figura pagada.
//
// Rendimiento: dos consultas (los socios y un conteo agrupado de deudas), sin una consulta por socio.

import { Op } from 'sequelize';
import { User } from '../models/user.models.js';
import { Cuota } from '../models/cuota.models.js';
import { FILTRO_SOLO_SOCIOS } from './abonaCuota.service.js';

export const MESES_ANTIGUEDAD_MINIMA = 6;
const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

// "YYYY-MM-DD" válido de verdad (rechaza 2026-02-30 o 2026-13-01).
export const esFechaValida = (texto) => {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [anio, mes, dia] = texto.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
};

// Resta meses a una fecha "YYYY-MM-DD" por calendario. Si el día no existe en el mes destino, usa el
// último día del mes (31/08 - 6 meses = 28/02, o 29/02 en año bisiesto).
export const restarMeses = (fecha, meses) => {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const totalMeses = anio * 12 + (mes - 1) - meses;
  const anioDestino = Math.floor(totalMeses / 12);
  const mesDestino = (totalMeses % 12) + 1;
  const ultimoDia = new Date(Date.UTC(anioDestino, mesDestino, 0)).getUTCDate();
  const dd = String(Math.min(dia, ultimoDia)).padStart(2, '0');
  return `${anioDestino}-${String(mesDestino).padStart(2, '0')}-${dd}`;
};

// Fecha de calendario argentina ("YYYY-MM-DD") de un momento guardado en la base.
const fechaArgentina = (momento) => new Date(momento).toLocaleDateString('en-CA', { timeZone: ZONA_HORARIA });

const plural = (n, singular, pluralTexto) => (n === 1 ? singular : pluralTexto);

// fechaCorte: "YYYY-MM-DD" (hora argentina), calculada en JavaScript por quien llama.
export const calcularPadron = async ({ fechaCorte }) => {
  if (!esFechaValida(fechaCorte)) throw new Error('fechaCorte inválida: se espera YYYY-MM-DD');

  const socios = await User.findAll({
    where: { estado: 'aprobado', ...FILTRO_SOLO_SOCIOS },
    attributes: ['id', 'razonSocial', 'cuit', 'email', 'categoria', 'fechaAprobacion', 'createdAt'],
    order: [['razonSocial', 'ASC'], ['id', 'ASC']],
  });

  // Cuotas impagas ya vencidas a la fecha de corte, contadas por socio en una sola consulta.
  const deudasPorSocio = new Map();
  if (socios.length) {
    const conteo = await Cuota.count({
      where: {
        usuario_id: socios.map((s) => s.id),
        estado: { [Op.in]: ['pendiente', 'vencida'] },
        fecha_vencimiento: { [Op.lt]: fechaCorte },
      },
      group: ['usuario_id'],
    });
    for (const fila of conteo) deudasPorSocio.set(fila.usuario_id, Number(fila.count));
  }

  // Aprobado en esta fecha o antes = 6 meses cumplidos a la fecha de corte (ver BORDE arriba).
  const aprobadoComoMuyTarde = restarMeses(fechaCorte, MESES_ANTIGUEDAD_MINIMA);

  const habilitados = [];
  const noHabilitados = [];

  for (const socio of socios) {
    const aproximada = !socio.fechaAprobacion;
    const fechaAprobacion = fechaArgentina(socio.fechaAprobacion ?? socio.createdAt);
    const cuotasVencidas = deudasPorSocio.get(socio.id) ?? 0;

    const motivos = [];
    if (socio.categoria !== 'activo') motivos.push(`Categoría ${socio.categoria}`);
    if (fechaAprobacion > aprobadoComoMuyTarde) motivos.push(`Antigüedad menor a ${MESES_ANTIGUEDAD_MINIMA} meses`);
    if (cuotasVencidas > 0) {
      motivos.push(`Tiene ${cuotasVencidas} ${plural(cuotasVencidas, 'cuota vencida', 'cuotas vencidas')}`);
    }

    // Solo datos de identificación: nada de teléfono, dirección, constancia ni datos de acceso.
    const fila = {
      id: socio.id,
      razonSocial: socio.razonSocial,
      cuit: socio.cuit ?? null,
      email: socio.email,
      categoria: socio.categoria,
      fechaAprobacion,
      fechaAprobacionAproximada: aproximada, // true = se usó la fecha de registro (socio previo al campo)
    };

    if (motivos.length) noHabilitados.push({ ...fila, motivos });
    else habilitados.push(fila);
  }

  return { fechaCorte, totalHabilitados: habilitados.length, habilitados, noHabilitados };
};

// ---------- CSV ----------
// Excel interpreta como fórmula una celda que empieza con = + - @ (o tab / retorno): una razón social
// maliciosa podría ejecutar algo al abrir el archivo. Se le antepone un apóstrofo para que sea texto.
const celdaSegura = (valor) => {
  let texto = String(valor ?? '');
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return /[;"\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

// Separador ";" (el que usa Excel en español) y BOM UTF-8 al principio para que muestre bien las tildes.
export const padronACsv = (habilitados) => {
  const filas = [
    ['N°', 'Razón social', 'CUIT', 'Categoría'],
    ...habilitados.map((s, i) => [i + 1, s.razonSocial, s.cuit, s.categoria]),
  ];
  return `﻿${filas.map((fila) => fila.map(celdaSegura).join(';')).join('\r\n')}\r\n`;
};

// Al aprobar una cuenta se registra la fecha, salvo que ya tenga una (una re-aprobación no la pisa:
// la antigüedad cuenta desde la primera aprobación). Solo actúa si el estado CAMBIA a 'aprobado' en esta
// operación: si el admin edita otro dato (rubro, teléfono...) de un socio aprobado antes de que existiera
// este campo, no hay que ponerle la fecha de hoy, porque perdería la antigüedad que se toma de createdAt.
// usuario: instancia de Sequelize (usa changed() para saber si el estado cambió).
export const registrarFechaAprobacion = (usuario, ahora = new Date()) => {
  const pasaAAprobado = usuario.estado === 'aprobado' && usuario.changed('estado');
  if (pasaAAprobado && !usuario.fechaAprobacion) usuario.fechaAprobacion = ahora;
};
