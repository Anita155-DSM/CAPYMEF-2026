// ==========================================
// Cifras del inicio del panel de administración
// ==========================================
// Por qué existe: las tres tarjetas inferiores del inicio del admin (Pages/Admin/Inicio.jsx) mostraban
// cifras inventadas ("$1.850.000", "18%", "28/8"...). Acá se calculan con datos reales.
//
// Reglas (cada una con su tarjeta):
// 1) RECAUDACIÓN DEL MES — período = mes actual en hora argentina ("YYYY-MM").
//    En todas las cifras se dejan afuera las cuentas de gestión (admin): no son socios ni pagan cuota
//    (ver abonaCuota.service.js), aunque hayan quedado con cuotas viejas.
//    - montoRecaudado: suma de montoAbonado de los pagos de las CUOTAS DE ESE MES (cuota.mes_anio).
//      [A confirmar] No cuenta lo cobrado este mes por cuotas atrasadas de meses anteriores.
//    - porcentajeCobrado: cuotas pagadas del mes / cuotas generadas del mes × 100 (un decimal).
//      null si el mes no tiene cuotas: un 0% haría creer que nadie pagó.
// 2) ÍNDICE DE MOROSIDAD
//    - indice: socios con al menos 1 cuota vencida sin pagar / socios con al menos 1 cuota generada
//      (cualquier mes) × 100. Solo socios aprobados (una cuenta dada de baja no cuenta).
//      [A confirmar] Es la proporción de SOCIOS morosos, no de cuotas. null si nadie tiene cuotas.
//    - sociosEnRiesgo: socios Activos (aprobados) con umbralRiesgo o más cuotas vencidas, es decir a
//      una cuota (o ya en el límite) de pasar a Adherente por mora (ver categoria.service.js).
//    - umbralRiesgo: ese número (hoy 2). Es el "(2 cuotas impagas)" de la tarjeta: el criterio, no un total.
//    - cuotasVencidas: total de cuotas vencidas sin pagar de socios aprobados (dato extra).
// 3) PRÓXIMA CAPACITACIÓN — el modelo Evento no distingue "capacitación" de otros eventos.
//    [A confirmar] Se toma el próximo EVENTO cualquiera: no cancelado, con fecha de hoy en adelante, el más
//    cercano (desempata la hora de inicio). Con sus inscriptos y su cupo. null si no hay ninguno.
// 4) SOCIOS — conteos del padrón (ver calcularSocios, más abajo).
//
// Rendimiento: la base es remota y cada consulta tarda, así que todo son conteos y sumas agregadas
// (count / sum / count agrupado), sin recorrer registros con una consulta por cada uno.
// Las fechas se calculan en JavaScript (no con funciones de Postgres) para que funcione igual en SQLite.

import { Op } from 'sequelize';
import { Cuota } from '../models/cuota.models.js';
import { Pago } from '../models/pago.models.js';
import { User } from '../models/user.models.js';
import { Evento } from '../models/evento.models.js';
import { LIMITE_CUOTAS_VENCIDAS } from './categoria.service.js';
import { FILTRO_SOLO_SOCIOS, INCLUDE_SOLO_SOCIOS } from './abonaCuota.service.js';
import { contarInscriptos } from './inscripcion.service.js';

// Con 1 cuota menos que el límite de degradación, el socio ya está "en riesgo".
export const UMBRAL_RIESGO = LIMITE_CUOTAS_VENCIDAS - 1;

// Porcentaje con un decimal. Si no hay base (total 0) devuelve null: nunca una división por cero ni NaN.
export const porcentaje = (parte, total) => {
  if (!Number.isFinite(parte) || !Number.isFinite(total) || total <= 0) return null;
  return Math.round((parte / total) * 1000) / 10;
};

const SOLO_SOCIOS_APROBADOS = [{ model: User, as: 'socio', attributes: [], where: { estado: 'aprobado', ...FILTRO_SOLO_SOCIOS } }];

const calcularRecaudacion = async (periodo) => {
  const [cuotasDelMes, cuotasPagadas, idsCuotasDelMes] = await Promise.all([
    Cuota.count({ where: { mes_anio: periodo }, include: INCLUDE_SOLO_SOCIOS }),
    Cuota.count({ where: { mes_anio: periodo, estado: 'pagada' }, include: INCLUDE_SOLO_SOCIOS }),
    Cuota.findAll({ where: { mes_anio: periodo }, attributes: ['id'], include: INCLUDE_SOLO_SOCIOS, raw: true }),
  ]);

  // Una sola suma sobre los pagos de esas cuotas (no una consulta por cuota).
  const ids = idsCuotasDelMes.map((c) => c.id);
  const montoRecaudado = ids.length ? Number(await Pago.sum('montoAbonado', { where: { cuota_id: ids } })) || 0 : 0;

  return { montoRecaudado, cuotasDelMes, cuotasPagadas, porcentajeCobrado: porcentaje(cuotasPagadas, cuotasDelMes) };
};

const calcularMorosidad = async () => {
  const [sociosConCuotas, sociosConDeuda, cuotasVencidas, activos] = await Promise.all([
    Cuota.count({ distinct: true, col: 'usuario_id', include: SOLO_SOCIOS_APROBADOS }),
    Cuota.count({ distinct: true, col: 'usuario_id', where: { estado: 'vencida' }, include: SOLO_SOCIOS_APROBADOS }),
    Cuota.count({ where: { estado: 'vencida' }, include: SOLO_SOCIOS_APROBADOS }),
    User.findAll({ where: { estado: 'aprobado', categoria: 'activo', ...FILTRO_SOLO_SOCIOS }, attributes: ['id'], raw: true }),
  ]);

  // Cuántas vencidas tiene cada socio Activo: un solo conteo agrupado por socio.
  let sociosEnRiesgo = 0;
  if (activos.length) {
    const vencidasPorSocio = await Cuota.count({
      where: { estado: 'vencida', usuario_id: activos.map((u) => u.id) },
      group: ['usuario_id'],
    });
    sociosEnRiesgo = vencidasPorSocio.filter((fila) => Number(fila.count) >= UMBRAL_RIESGO).length;
  }

  return {
    indice: porcentaje(sociosConDeuda, sociosConCuotas),
    sociosConDeuda,
    sociosConCuotas,
    sociosEnRiesgo,
    umbralRiesgo: UMBRAL_RIESGO,
    cuotasVencidas,
  };
};

const buscarProximoEvento = async (hoy) => {
  const evento = await Evento.findOne({
    where: { estado: { [Op.ne]: 'cancelado' }, fecha: { [Op.gte]: hoy } },
    order: [['fecha', 'ASC'], ['horaInicio', 'ASC']],
    attributes: ['id', 'titulo', 'fecha', 'horaInicio', 'modalidad', 'cupoMaximo'],
  });
  if (!evento) return null;

  // Mismo conteo que el detalle del evento y la inscripción (ver inscripcion.service.js).
  const inscriptos = await contarInscriptos(evento.id);
  const cupoMaximo = evento.cupoMaximo ?? null;
  return {
    id: evento.id,
    titulo: evento.titulo,
    fecha: evento.fecha,
    horaInicio: evento.horaInicio ?? null,
    modalidad: evento.modalidad,
    inscriptos,
    cupoMaximo,
    // null si el evento no tiene cupo; nunca negativo aunque haya más inscriptos que cupo.
    cuposDisponibles: cupoMaximo == null ? null : Math.max(cupoMaximo - inscriptos, 0),
  };
};

// 4) SOCIOS — conteos para las tarjetas del padrón del inicio. Antes los calculaba el frontend descargando TODOS
//    los usuarios (GET /admin/usuarios) y filtrándolos en el navegador; además contaba a las cuentas de gestión
//    (admin), que no son socios. Acá son consultas de conteo, sin admins (FILTRO_SOLO_SOCIOS).
//    - totalSocios: socios aprobados (el padrón). Es la suma de porCategoria.
//    - porCategoria: aprobados de cada categoría; todas las categorías aparecen, en 0 si no hay ninguno.
//    - solicitudesPendientes: cuentas en estado pendiente (esperan aprobación).
//    - degradadosPorMora: aprobados que el sistema pasó a Adherente por mora (subconjunto de adherente).
//    Rechazados e inactivos no cuentan en ningún número (el frontend tampoco los usa).
const calcularSocios = async () => {
  const [aprobadosPorCategoria, solicitudesPendientes, degradadosPorMora] = await Promise.all([
    User.count({ where: { estado: 'aprobado', ...FILTRO_SOLO_SOCIOS }, group: ['categoria'] }),
    User.count({ where: { estado: 'pendiente', ...FILTRO_SOLO_SOCIOS } }),
    User.count({ where: { estado: 'aprobado', degradadoPorMora: true, ...FILTRO_SOLO_SOCIOS } }),
  ]);

  // Todas las categorías del modelo, en 0, así el frontend nunca recibe una clave faltante ni null.
  const porCategoria = Object.fromEntries(User.rawAttributes.categoria.values.map((categoria) => [categoria, 0]));
  for (const { categoria, count } of aprobadosPorCategoria) {
    if (categoria in porCategoria) porCategoria[categoria] = Number(count);
  }

  return {
    totalSocios: Object.values(porCategoria).reduce((suma, cantidad) => suma + cantidad, 0),
    porCategoria,
    solicitudesPendientes,
    degradadosPorMora,
  };
};

// hoy: "YYYY-MM-DD" (fecha argentina). Se recibe por parámetro para poder probar cualquier fecha.
export const calcularResumenInicio = async ({ hoy }) => {
  const periodo = hoy.slice(0, 7);
  const [recaudacion, morosidad, proximoEvento, socios] = await Promise.all([
    calcularRecaudacion(periodo),
    calcularMorosidad(),
    buscarProximoEvento(hoy),
    calcularSocios(),
  ]);
  // socios es nuevo; las claves anteriores quedan iguales.
  return { periodo, recaudacion, morosidad, proximoEvento, socios };
};
