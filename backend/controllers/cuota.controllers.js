import { Op } from 'sequelize';
import { generarCuotasDelMes, marcarCuotasVencidas, enviarRecordatoriosDeVencimiento } from '../services/cuota.service.js';
import { Cuota } from '../models/cuota.models.js';
import { Notificacion } from '../models/notificacion.models.js';
import {
  crearNotificacion,
  notificarAdmins,
  formatearMonto,
  formatearPeriodo,
} from '../services/notificacion.service.js';
import { User } from '../models/user.models.js';
import { Pago } from '../models/pago.models.js';
import { generarComprobantePago } from '../services/comprobante.service.js';
import { enviarMailComprobantePago } from '../config/mailer.js';
import { subirPDFCloudinary } from '../services/cloudinary.service.js';

// ==========================================
// 1. EJECUCIÓN MANUAL (Para Pruebas y Admin)
// ==========================================
export const ejecutarGeneracionCuotas = async (req, res) => {
  try {
    const resultado = await generarCuotasDelMes();

    //auditoria
    req.auditoriaMensaje = `Se ejecutó la generación masiva de cuotas. Creadas: ${resultado.creadas} cuotas para el periodo ${resultado.periodo}`;
    req.auditoriaCodigo = 'GENERAR_CUOTAS_MASIVO';

    res.status(200).json({
      exito: true,
      mensaje: `Proceso finalizado. Se generaron ${resultado.creadas} cuotas para el periodo ${resultado.periodo}.`,
      data: resultado,
    });
  } catch (error) {
    console.error('Error al generar cuotas manualmente:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al generar las cuotas mensuales.' });
  }
};

// ==========================================
// 2. OBTENER LISTADO DE CUOTAS
// ==========================================
export const obtenerCuotas = async (req, res) => {
  try {
    const cuotas = await Cuota.findAll({
      include: [{
        model: User,
        as: 'socio',
        attributes: ['id', 'razonSocial', 'cuit', 'email', 'categoria']
      }],
      order: [['mes_anio', 'DESC'], ['createdAt', 'DESC']]
    });

    res.status(200).json({ exito: true, data: cuotas });
  } catch (error) {
    console.error('Error al obtener cuotas:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al obtener las cuotas.' });
  }
};

// ==========================================
// 1. OBTENER CUOTAS PENDIENTES / DEUDAS (MOROSOS)
// ==========================================
export const obtenerCuotasPendientes = async (req, res) => {
  try {
    const pendientes = await Cuota.findAll({
      where: { estado: { [Op.in]: ['pendiente', 'vencida'] } },
      include: [{
        model: User,
        as: 'socio',
        attributes: ['id', 'razonSocial', 'cuit', 'email', 'telefono', 'categoria']
      }],
      order: [['fecha_vencimiento', 'ASC']]
    });

    res.status(200).json({ exito: true, total: pendientes.length, data: pendientes });
  } catch (error) {
    console.error('Error al obtener deudas pendientes:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al consultar deudas pendientes.' });
  }
};

// ==========================================
// 2. MARCAR CUOTA COMO PAGADA (REGISTRO MANUAL DE PAGO)
// ==========================================
export const registrarPagoManual = async (req, res) => {
  try {
    const { id } = req.params; // ID de la Cuota
    const { metodoPago, nroComprobante, observaciones } = req.body;

    const cuota = await Cuota.findByPk(id, {
      include: [{ model: User, as: 'socio', attributes: ['id', 'razonSocial', 'cuit', 'email'] }],
    });

    if (!cuota) {
      return res.status(404).json({ exito: false, mensaje: 'Cuota no encontrada.' });
    }

    if (cuota.estado === 'pagada') {
      return res.status(400).json({ exito: false, mensaje: 'Esta cuota ya fue abonada anteriormente.' });
    }

    // 1. Creamos el registro del Pago
    // Si dos pedidos llegan a la vez (doble clic, o el pago online justo ahora), los dos
    // pasan el chequeo de "ya pagada" de arriba. La restricción única de pagos.cuota_id hace
    // que solo uno gane: el otro recibe este aviso en vez de crear un pago duplicado.
    let nuevoPago;
    try {
      nuevoPago = await Pago.create({
        cuota_id: cuota.id,
        usuario_id: cuota.usuario_id,
        montoAbonado: cuota.monto,
        metodoPago: metodoPago || 'Transferencia',
        nroComprobante: nroComprobante || null,
        observaciones: observaciones || 'Registro manual por administración'
      });
    } catch (errorCreacion) {
      if (errorCreacion.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ exito: false, mensaje: 'Esta cuota ya fue abonada anteriormente.' });
      }
      throw errorCreacion;
    }

    // 2. Actualizamos el estado de la cuota
    cuota.estado = 'pagada';
    await cuota.save();

    // Alertas internas (nunca lanzan error: no pueden romper el registro del pago).
    // Al socio: su pago ya figura.
    await crearNotificacion({
      usuarioId: cuota.usuario_id,
      tipo: 'pago_registrado',
      titulo: 'Registramos tu pago',
      mensaje: `Registramos tu pago de ${formatearMonto(nuevoPago.montoAbonado)} por la cuota de ${formatearPeriodo(cuota.mes_anio)}. Ya podés descargar tu comprobante desde la sección de pagos.`,
      referencia: `pago-registrado:${nuevoPago.id}`,
    });
    // A los demás administradores: queda un pago para que Tesorería lo verifique contra el banco.
    // Se excluye a quien lo cargó, que ya sabe de este pago.
    await notificarAdmins({
      tipo: 'pago_por_confirmar',
      titulo: 'Pago manual por confirmar',
      mensaje: `${cuota.socio?.razonSocial || 'Un socio'}: pago de ${formatearMonto(nuevoPago.montoAbonado)} (cuota ${formatearPeriodo(cuota.mes_anio)}) cargado por administración. Falta la confirmación de Tesorería.`,
      referencia: `pago-por-confirmar:${nuevoPago.id}`,
      excluirUsuarioId: req.usuario.id,
    });

    // 3. Generamos el comprobante en PDF, lo mandamos por mail y lo subimos a
    // Cloudinary para dejarlo guardado como snapshot histórico del pago.
    // Cada paso es independiente: si uno falla, no bloquea a los demás ni la
    // respuesta al admin — el pago ya quedó impactado, que es lo importante.
    try {
      const pdfBuffer = await generarComprobantePago({
        socio: cuota.socio,
        cuota: { mes_anio: cuota.mes_anio },
        pago: nuevoPago,
      });

      try {
        await enviarMailComprobantePago(
          cuota.socio.email,
          { razonSocial: cuota.socio.razonSocial, mesAnio: cuota.mes_anio, monto: nuevoPago.montoAbonado },
          pdfBuffer
        );
      } catch (errorMail) {
        console.error('Error al enviar el mail de comprobante:', errorMail.message);
      }

      try {
        const resultadoCloudinary = await subirPDFCloudinary(pdfBuffer, {
          folder: 'capymef_comprobantes_pago',
          public_id: `comprobante-${nuevoPago.id}`,
        });
        nuevoPago.urlComprobante = resultadoCloudinary.secure_url;
        await nuevoPago.save();
      } catch (errorCloudinary) {
        console.error('Error al subir el comprobante a Cloudinary:', errorCloudinary.message);
      }
    } catch (errorComprobante) {
      console.error('Error al generar el comprobante de pago:', errorComprobante.message);
    }

    //auditoria
    req.auditoriaMensaje = `Se registró el pago manual de $${cuota.monto} para la cuota #${cuota.id} del socio ${cuota.socio?.razonSocial || cuota.usuario_id}`;
    req.auditoriaCodigo = 'REGISTRAR_PAGO_MANUAL';

    res.status(200).json({
      exito: true,
      mensaje: 'El pago ha sido registrado e impactado correctamente.',
      data: { cuota, pago: nuevoPago }
    });

  } catch (error) {
    console.error('Error al registrar el pago:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor al procesar el pago.' });
  }
};

// ==========================================
// 3. RESUMEN FINANCIERO (Dashboard Admin)
// ==========================================
export const obtenerResumenFinanciero = async (req, res) => {
  try {
    const totalPendientes = await Cuota.count({ where: { estado: 'pendiente' } });
    const totalPagadas = await Cuota.count({ where: { estado: 'pagada' } });
    const totalVencidas = await Cuota.count({ where: { estado: 'vencida' } });

    const recaudacionTotal = await Pago.sum('montoAbonado') || 0;

    res.status(200).json({
      exito: true,
      data: {
        cuotasPendientesCount: totalPendientes,
        cuotasPagadasCount: totalPagadas,
        cuotasVencidasCount: totalVencidas,
        totalRecaudado: recaudacionTotal
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen financiero:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al generar resumen financiero.' });
  }
};

// ==========================================
// 4. REDESCARGAR UN COMPROBANTE YA EMITIDO
// ==========================================
export const descargarComprobante = async (req, res) => {
  try {
    const { id } = req.params;

    const cuota = await Cuota.findByPk(id, {
      include: [
        { model: User, as: 'socio', attributes: ['razonSocial', 'cuit'] },
        { model: Pago, as: 'pago' },
      ],
    });

    if (!cuota) {
      return res.status(404).json({ exito: false, mensaje: 'Cuota no encontrada.' });
    }

    if (cuota.estado !== 'pagada' || !cuota.pago) {
      return res.status(400).json({ exito: false, mensaje: 'Esta cuota todavía no tiene un pago registrado.' });
    }

    // Si ya tenemos el comprobante guardado en Cloudinary, redirigimos directo:
    // es un snapshot fiel del momento del pago, y más rápido que regenerarlo.
    if (cuota.pago.urlComprobante) {
      return res.redirect(cuota.pago.urlComprobante);
    }

    // Fallback: pagos registrados ANTES de este cambio no tienen la URL guardada.
    // Para esos, seguimos regenerando el PDF al vuelo como antes.
    const pdfBuffer = await generarComprobantePago({
      socio: cuota.socio,
      cuota: { mes_anio: cuota.mes_anio },
      pago: cuota.pago,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="comprobante-${cuota.mes_anio}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al redescargar el comprobante:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor al generar el comprobante.' });
  }
};

// ==========================================
// 5. CERRAR LA VENTANA DE PAGO A MANO (Admin)
// ==========================================
// Hace lo mismo que el cron diario. Sirve para probar y como respaldo
// si el servidor estuvo apagado a la hora del cron.
export const ejecutarMarcadoVencidas = async (req, res) => {
  try {
    const resultado = await marcarCuotasVencidas();

    //auditoria
    req.auditoriaMensaje = `Se ejecutó el cierre de la ventana de pago. Cuotas marcadas como vencidas: ${resultado.marcadas}`;
    req.auditoriaCodigo = 'MARCAR_CUOTAS_VENCIDAS';

    res.status(200).json({
      exito: true,
      mensaje: `Proceso finalizado. ${resultado.marcadas} cuotas pasaron a vencidas.`,
      data: resultado,
    });
  } catch (error) {
    console.error('Error al marcar cuotas vencidas:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al marcar las cuotas vencidas.' });
  }
};

// ==========================================
// 6. LISTAR PAGOS SIN CONFIRMAR (Tesorería)
// ==========================================
export const obtenerPagosSinConfirmar = async (req, res) => {
  try {
    const pagos = await Pago.findAll({
      where: { confirmadoAt: null },
      include: [{ model: User, as: 'socio', attributes: ['id', 'razonSocial', 'cuit', 'email'] }],
      order: [['fechaPago', 'ASC']],
    });

    res.status(200).json({ exito: true, total: pagos.length, data: pagos });
  } catch (error) {
    console.error('Error al obtener pagos sin confirmar:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al consultar los pagos sin confirmar.' });
  }
};

// ==========================================
// 7. CONFIRMAR PAGOS (Tesorería) — uno o varios a la vez
// ==========================================
// Se usa tanto para confirmar de a uno como en un cierre mensual, verificando
// contra el extracto bancario de BBVA. No vuelve a tocar la Cuota (ya quedó
// "pagada" al registrarse el pago): solo dejamos constancia de que Tesorería
// lo revisó y coincide con lo acreditado en el banco.
export const confirmarPagos = async (req, res) => {
  try {
    const { pagoIds } = req.body; // array de UUIDs de Pago

    if (!Array.isArray(pagoIds) || pagoIds.length === 0) {
      return res.status(400).json({ exito: false, mensaje: 'Debe enviar al menos un ID de pago en "pagoIds".' });
    }

    const pagos = await Pago.findAll({ where: { id: pagoIds } });

    if (pagos.length === 0) {
      return res.status(404).json({ exito: false, mensaje: 'No se encontró ninguno de los pagos indicados.' });
    }

    const yaConfirmados = pagos.filter((p) => p.confirmadoAt !== null).map((p) => p.id);
    const aConfirmar = pagos.filter((p) => p.confirmadoAt === null);

    for (const pago of aConfirmar) {
      pago.confirmadoPor = req.usuario.id;
      pago.confirmadoAt = new Date();
      await pago.save();

      // Aviso al socio de que Tesorería verificó su pago.
      await crearNotificacion({
        usuarioId: pago.usuario_id,
        tipo: 'pago_confirmado',
        titulo: 'Tu pago fue confirmado',
        mensaje: `Tesorería verificó tu pago de ${formatearMonto(pago.montoAbonado)}.`,
        referencia: `pago-confirmado:${pago.id}`,
      });
    }

    // Las alertas "pago por confirmar" de los admins ya no tienen nada pendiente: las damos
    // por leídas para que no queden en la bandeja avisando algo que ya se resolvió.
    // Si esto fallara, la confirmación igual quedó hecha: solo lo registramos.
    if (aConfirmar.length > 0) {
      try {
        await Notificacion.update(
          { leida: true, leidaAt: new Date() },
          {
            where: {
              tipo: 'pago_por_confirmar',
              leida: false,
              referencia: aConfirmar.map((p) => `pago-por-confirmar:${p.id}`),
            },
          }
        );
      } catch (errorNotificaciones) {
        console.error('No se pudieron cerrar las alertas de pagos por confirmar:', errorNotificaciones.message);
      }
    }

    //auditoria
    req.auditoriaMensaje = `Se confirmaron ${aConfirmar.length} pago(s) por Tesorería${yaConfirmados.length ? ` (${yaConfirmados.length} ya estaban confirmados)` : ''}`;
    req.auditoriaCodigo = 'CONFIRMAR_PAGOS_TESORERIA';

    res.status(200).json({
      exito: true,
      mensaje: `${aConfirmar.length} pago(s) confirmado(s) correctamente.`,
      confirmados: aConfirmar.map((p) => p.id),
      yaEstabanConfirmados: yaConfirmados,
      idsNoEncontrados: pagoIds.filter((id) => !pagos.some((p) => p.id === id)),
    });
  } catch (error) {
    console.error('Error al confirmar pagos:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor al confirmar los pagos.' });
  }
};

// ==========================================
// 8. ENVIAR RECORDATORIOS DE VENCIMIENTO A MANO (Admin)
// ==========================================
// Hace lo mismo que el cron del día 7. Sirve para probar y como respaldo si el
// servidor estuvo apagado ese día. Es seguro repetirlo: no duplica alertas.
export const ejecutarRecordatorios = async (req, res) => {
  try {
    const resultado = await enviarRecordatoriosDeVencimiento();

    //auditoria
    req.auditoriaMensaje = `Se ejecutó el envío de recordatorios de vencimiento. Alertas creadas: ${resultado.enviados}`;
    req.auditoriaCodigo = 'ENVIAR_RECORDATORIOS_CUOTAS';

    res.status(200).json({
      exito: true,
      mensaje: `Proceso finalizado. Se enviaron ${resultado.enviados} recordatorio(s).`,
      data: resultado,
    });
  } catch (error) {
    console.error('Error al enviar recordatorios de vencimiento:', error);
    res.status(500).json({ exito: false, mensaje: 'Error al enviar los recordatorios de vencimiento.' });
  }
};
