import { Op } from 'sequelize';
import { User } from '../models/user.models.js';
import { Cuota } from '../models/cuota.models.js';
import { crearNotificacion, notificarAdmins } from './notificacion.service.js';

// ==========================================
// Regla de la Cámara: un socio Activo con 3 cuotas vencidas sin pagar pasa a Adherente,
// y vuelve a Activo cuando regulariza su deuda.
// ==========================================
// Se cuentan cuotas vencidas SIN PAGAR, no importa si son consecutivas: así no se puede
// esquivar la regla pagando una cuota suelta. Para cambiar el límite, editar solo este número.
export const LIMITE_CUOTAS_VENCIDAS = 3;

// "YYYY-MM-DD" en hora argentina (igual que en cuota.service.js; se repite acá para no crear
// un import circular, ya que cuota.service.js usa este archivo).
const hoyArgentina = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

// Evalúa UN socio y, si corresponde, le cambia la categoría.
// Devuelve 'degradado', 'recuperado' o null (sin cambios).
//
// IMPORTANTE: nunca lanza error. Cambiar la categoría es una consecuencia de un pago o de un
// cron: si esto fallara no puede tumbar el registro de un pago ni el cierre de cuotas.
export const evaluarCategoriaSocio = async (usuarioId) => {
  try {
    const socio = await User.findByPk(usuarioId, {
      attributes: ['id', 'razonSocial', 'categoria', 'estado', 'degradadoPorMora'],
    });

    // Solo se evalúan cuentas habilitadas. Padrino y honorario nunca se tocan.
    if (!socio || socio.estado !== 'aprobado') return null;

    const vencidas = await Cuota.count({ where: { usuario_id: socio.id, estado: 'vencida' } });
    const hoy = hoyArgentina();

    // ---- DEGRADACIÓN: Activo -> Adherente ----
    if (socio.categoria === 'activo' && vencidas >= LIMITE_CUOTAS_VENCIDAS) {
      // El UPDATE lleva "categoria: 'activo'" en el WHERE: si dos procesos evalúan al mismo
      // tiempo (un cron y un pago), solo uno efectivamente cambia la categoría y avisa.
      const [cambiados] = await User.update(
        { categoria: 'adherente', degradadoPorMora: true },
        { where: { id: socio.id, categoria: 'activo' } }
      );
      if (cambiados === 0) return null;

      await crearNotificacion({
        usuarioId: socio.id,
        tipo: 'categoria_degradada',
        titulo: 'Tu categoría pasó a Adherente',
        mensaje: `Tenés ${vencidas} cuotas vencidas sin pagar, por eso tu categoría pasó de Activo a Adherente. Cuando regularices tu deuda vas a volver a ser Activo automáticamente.`,
        referencia: `categoria-degradada:${socio.id}:${hoy}`,
      });
      await notificarAdmins({
        tipo: 'socio_degradado',
        titulo: 'Un socio pasó a Adherente por mora',
        mensaje: `${socio.razonSocial} pasó de Activo a Adherente por tener ${vencidas} cuotas vencidas sin pagar.`,
        referencia: `socio-degradado:${socio.id}:${hoy}`,
      });

      console.log(`Categoría: ${socio.razonSocial} pasó de Activo a Adherente (${vencidas} cuotas vencidas).`);
      return 'degradado';
    }

    // ---- RECUPERACIÓN: Adherente -> Activo ----
    // Solo para quien fue degradado POR MORA (degradadoPorMora). Un Adherente que siempre lo
    // fue, o al que un admin lo cambió a mano, no se convierte en Activo solo.
    // "Regularizar" es no tener ninguna cuota vencida: si alcanzara con bajar de 3, el socio
    // volvería a Activo debiendo todavía y caería de nuevo al mes siguiente.
    if (socio.categoria === 'adherente' && socio.degradadoPorMora && vencidas === 0) {
      const [cambiados] = await User.update(
        { categoria: 'activo', degradadoPorMora: false },
        { where: { id: socio.id, categoria: 'adherente', degradadoPorMora: true } }
      );
      if (cambiados === 0) return null;

      await crearNotificacion({
        usuarioId: socio.id,
        tipo: 'categoria_recuperada',
        titulo: 'Volviste a ser socio Activo',
        mensaje: 'Regularizaste tu deuda, así que tu categoría volvió a Activo. ¡Gracias por ponerte al día!',
        referencia: `categoria-recuperada:${socio.id}:${hoy}`,
      });
      await notificarAdmins({
        tipo: 'socio_recuperado',
        titulo: 'Un socio volvió a Activo',
        mensaje: `${socio.razonSocial} regularizó su deuda y volvió a la categoría Activo.`,
        referencia: `socio-recuperado:${socio.id}:${hoy}`,
      });

      console.log(`Categoría: ${socio.razonSocial} regularizó su deuda y volvió a Activo.`);
      return 'recuperado';
    }

    return null;
  } catch (error) {
    console.error(`No se pudo evaluar la categoría del usuario ${usuarioId}:`, error.message);
    return null;
  }
};

// Evalúa a todos los socios que podrían cambiar: los Activos (pueden degradarse) y los
// Adherentes degradados por mora (pueden recuperarse). Es seguro correrlo las veces que sea:
// si no hay nada para cambiar, no cambia nada. Lo usa el cierre diario de cuotas, que además
// aplica la regla a las deudas que ya existían cuando se puso en marcha.
export const evaluarCategoriasDeTodos = async () => {
  const candidatos = await User.findAll({
    where: {
      estado: 'aprobado',
      [Op.or]: [
        { categoria: 'activo' },
        { categoria: 'adherente', degradadoPorMora: true },
      ],
    },
    attributes: ['id'],
  });

  let degradados = 0;
  let recuperados = 0;

  for (const candidato of candidatos) {
    const resultado = await evaluarCategoriaSocio(candidato.id);
    if (resultado === 'degradado') degradados++;
    if (resultado === 'recuperado') recuperados++;
  }

  console.log(` Categorías evaluadas: ${degradados} degradado(s), ${recuperados} recuperado(s).`);
  return { degradados, recuperados };
};
