import { Op } from 'sequelize';
import { v2 as cloudinary } from 'cloudinary';
import { Evento } from '../models/evento.models.js';
import { Inscripcion } from '../models/inscripcion.models.js';
import { User } from '../models/user.models.js';
import { generarCertificadoAsistencia } from '../services/certificado.service.js';

// ==========================================
// Helpers para manejo de imagen en Cloudinary
// (mismo patrón que noticia.controllers.js)
// ==========================================
const eliminarImagenCloudinary = async (public_id) => {
  if (public_id) {
    try {
      await cloudinary.uploader.destroy(public_id);
    } catch (error) {
      console.error('Error al borrar imagen de Cloudinary:', error);
    }
  }
};

const extraerPublicIdDeUrl = (url) => {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  const despuesDeUpload = url.split('/upload/')[1];
  if (!despuesDeUpload) return null;
  const sinVersion = despuesDeUpload.replace(/^v\d+\//, '');
  const sinExtension = sinVersion.replace(/\.[^/.]+$/, '');
  return sinExtension;
};

// Como crearEvento/actualizarEvento reciben multipart/form-data (por la imagen),
// un array como logosExternos llega como texto plano, no como array de JS.
// Convención esperada del lado del frontend: mandar un JSON.stringify del array,
// ej: formData.append('logosExternos', JSON.stringify(['https://...', 'https://...'])).
const parsearLogosExternos = (valor) => {
  if (!valor) return [];
  if (Array.isArray(valor)) return valor; // por si algún día llega como JSON puro (sin multipart)
  try {
    const parseado = JSON.parse(valor);
    return Array.isArray(parseado) ? parseado : [];
  } catch {
    return [];
  }
};

// ==========================================
// 1. EVENTOS PARA LA LANDING (Públicos, sin login)
// ==========================================
export const obtenerEventosPublicos = async (req, res) => {
  try {
    const eventos = await Evento.findAll({
      where: { estado: { [Op.ne]: 'cancelado' } },
      order: [['fecha', 'ASC']],
    });

    res.status(200).json({ exito: true, data: eventos });
  } catch (error) {
    console.error('Error al obtener eventos públicos:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 2. EVENTOS PARA SOCIOS LOGUEADOS (marca si ya está inscripto)
// ==========================================
export const obtenerEventosSocios = async (req, res) => {
  try {
    const eventos = await Evento.findAll({
      where: { estado: { [Op.ne]: 'cancelado' } },
      order: [['fecha', 'ASC']],
    });

    const inscripciones = await Inscripcion.findAll({
      where: { usuario_id: req.usuario.id },
    });
    const idsInscriptos = new Set(inscripciones.map((i) => i.evento_id));

    const data = eventos.map((evento) => ({
      ...evento.toJSON(),
      yaInscripto: idsInscriptos.has(evento.id),
    }));

    res.status(200).json({ exito: true, data });
  } catch (error) {
    console.error('Error al obtener eventos para socios:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 3. OBTENER UN EVENTO POR ID (con cupo disponible calculado)
// ==========================================
export const obtenerEventoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const evento = await Evento.findByPk(id);

    if (!evento) {
      return res.status(404).json({ exito: false, mensaje: 'Evento no encontrado.' });
    }

    const totalInscriptos = await Inscripcion.count({ where: { evento_id: id } });
    const cupoDisponible = evento.cupoMaximo != null ? evento.cupoMaximo - totalInscriptos : null;

    res.status(200).json({
      exito: true,
      data: { ...evento.toJSON(), totalInscriptos, cupoDisponible },
    });
  } catch (error) {
    console.error('Error al obtener el evento:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 4. CREAR EVENTO (Admin)
// ==========================================
export const crearEvento = async (req, res) => {
  const imagenFile = req.file;

  try {
    const { titulo, descripcion, fecha, horaInicio, horaFin, modalidad, lugar, cupoMaximo, estado, logosExternos } = req.body;

    const nuevoEvento = await Evento.create({
      titulo,
      descripcion,
      fecha,
      horaInicio: horaInicio || null,
      horaFin: horaFin || null,
      modalidad: modalidad || 'presencial',
      lugar: lugar || null,
      cupoMaximo: cupoMaximo || null,
      estado: estado || 'programado',
      imagenUrl: imagenFile ? imagenFile.path : null,
      logosExternos: parsearLogosExternos(logosExternos),
    });

    //auditoria
    req.auditoriaMensaje = `Se creó el evento: "${titulo}" (${fecha})`;
    req.auditoriaCodigo = 'CREATE_EVENTO';

    res.status(201).json({
      exito: true,
      mensaje: 'Evento creado exitosamente.',
      data: nuevoEvento,
    });
  } catch (error) {
    if (imagenFile) eliminarImagenCloudinary(imagenFile.filename);
    console.error('Error al crear evento:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 5. ACTUALIZAR EVENTO (Admin)
// ==========================================
export const actualizarEvento = async (req, res) => {
  const imagenFile = req.file;

  try {
    const { id } = req.params;
    const { titulo, descripcion, fecha, horaInicio, horaFin, modalidad, lugar, cupoMaximo, estado, logosExternos } = req.body;

    const evento = await Evento.findByPk(id);

    if (!evento) {
      if (imagenFile) eliminarImagenCloudinary(imagenFile.filename);
      return res.status(404).json({ exito: false, mensaje: 'Evento no encontrado.' });
    }

    if (titulo) evento.titulo = titulo;
    if (descripcion) evento.descripcion = descripcion;
    if (fecha) evento.fecha = fecha;
    if (horaInicio !== undefined) evento.horaInicio = horaInicio || null;
    if (horaFin !== undefined) evento.horaFin = horaFin || null;
    if (modalidad) evento.modalidad = modalidad;
    if (lugar !== undefined) evento.lugar = lugar || null;
    if (cupoMaximo !== undefined) evento.cupoMaximo = cupoMaximo || null;
    if (estado) evento.estado = estado;
    if (logosExternos !== undefined) evento.logosExternos = parsearLogosExternos(logosExternos);

    if (imagenFile) {
      if (evento.imagenUrl) {
        const publicIdAnterior = extraerPublicIdDeUrl(evento.imagenUrl);
        eliminarImagenCloudinary(publicIdAnterior);
      }
      evento.imagenUrl = imagenFile.path;
    }

    await evento.save();

    //auditoria
    req.auditoriaMensaje = `Se actualizó el evento #${id}: "${evento.titulo}"`;
    req.auditoriaCodigo = 'UPDATE_EVENTO';

    res.status(200).json({
      exito: true,
      mensaje: 'Evento actualizado correctamente.',
      data: evento,
    });
  } catch (error) {
    if (imagenFile) eliminarImagenCloudinary(imagenFile.filename);
    console.error('Error al actualizar evento:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 6. ELIMINAR EVENTO (Admin, soft delete)
// ==========================================
export const eliminarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const evento = await Evento.findByPk(id);

    if (!evento) {
      return res.status(404).json({ exito: false, mensaje: 'Evento no encontrado.' });
    }

    const tituloBorrado = evento.titulo;
    await evento.destroy(); // Soft delete (paranoid: true)

    //auditoria
    req.auditoriaMensaje = `Se eliminó el evento #${id}: "${tituloBorrado}"`;
    req.auditoriaCodigo = 'DELETE_EVENTO';

    res.status(200).json({ exito: true, mensaje: 'Evento eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 7. INSCRIBIRSE A UN EVENTO (Socio logueado)
// ==========================================
export const inscribirseEvento = async (req, res) => {
  try {
    const { id } = req.params; // ID del evento
    const usuarioId = req.usuario.id;

    const evento = await Evento.findByPk(id);

    if (!evento) {
      return res.status(404).json({ exito: false, mensaje: 'Evento no encontrado.' });
    }

    if (evento.estado !== 'programado') {
      return res.status(400).json({ exito: false, mensaje: 'Este evento ya no admite inscripciones.' });
    }

    // Verificamos que no esté ya inscripto
    const inscripcionExistente = await Inscripcion.findOne({
      where: { evento_id: id, usuario_id: usuarioId },
    });
    if (inscripcionExistente) {
      return res.status(400).json({ exito: false, mensaje: 'Ya estás inscripto a este evento.' });
    }

    // Verificamos el cupo, si el evento tiene límite
    if (evento.cupoMaximo != null) {
      const totalInscriptos = await Inscripcion.count({ where: { evento_id: id } });
      if (totalInscriptos >= evento.cupoMaximo) {
        return res.status(400).json({ exito: false, mensaje: 'El cupo para este evento ya está completo.' });
      }
    }

    const nuevaInscripcion = await Inscripcion.create({
      evento_id: id,
      usuario_id: usuarioId,
    });

    //auditoria
    req.auditoriaMensaje = `El usuario se inscribió al evento "${evento.titulo}"`;
    req.auditoriaCodigo = 'INSCRIPCION_EVENTO';

    res.status(201).json({
      exito: true,
      mensaje: 'Inscripción registrada correctamente.',
      data: nuevaInscripcion,
    });
  } catch (error) {
    console.error('Error al inscribirse al evento:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 8. CANCELAR INSCRIPCIÓN (Socio logueado)
// ==========================================
export const cancelarInscripcion = async (req, res) => {
  try {
    const { id } = req.params; // ID del evento
    const usuarioId = req.usuario.id;

    const inscripcion = await Inscripcion.findOne({
      where: { evento_id: id, usuario_id: usuarioId },
    });

    if (!inscripcion) {
      return res.status(404).json({ exito: false, mensaje: 'No tenés una inscripción activa en este evento.' });
    }

    await inscripcion.destroy();

    //auditoria
    req.auditoriaMensaje = `El usuario canceló su inscripción al evento #${id}`;
    req.auditoriaCodigo = 'CANCELAR_INSCRIPCION_EVENTO';

    res.status(200).json({ exito: true, mensaje: 'Inscripción cancelada correctamente.' });
  } catch (error) {
    console.error('Error al cancelar inscripción:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 9. LISTAR INSCRIPTOS DE UN EVENTO (Admin — base del checklist)
// ==========================================
export const obtenerInscriptos = async (req, res) => {
  try {
    const { id } = req.params; // ID del evento

    const evento = await Evento.findByPk(id);
    if (!evento) {
      return res.status(404).json({ exito: false, mensaje: 'Evento no encontrado.' });
    }

    const inscriptos = await Inscripcion.findAll({
      where: { evento_id: id },
      include: [{ model: User, as: 'socio', attributes: ['id', 'razonSocial', 'cuit', 'email', 'telefono'] }],
      order: [['fechaInscripcion', 'ASC']],
    });

    res.status(200).json({
      exito: true,
      evento: { id: evento.id, titulo: evento.titulo, fecha: evento.fecha },
      total: inscriptos.length,
      data: inscriptos,
    });
  } catch (error) {
    console.error('Error al obtener inscriptos:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 10. MARCAR ASISTENCIA (Admin — el "checklist" en sí)
// ==========================================
export const marcarAsistencia = async (req, res) => {
  try {
    const { eventoId, inscripcionId } = req.params;
    const { asistio } = req.body; // true o false

    const inscripcion = await Inscripcion.findOne({
      where: { id: inscripcionId, evento_id: eventoId },
      include: [{ model: User, as: 'socio', attributes: ['razonSocial'] }],
    });

    if (!inscripcion) {
      return res.status(404).json({ exito: false, mensaje: 'Inscripción no encontrada para este evento.' });
    }

    inscripcion.asistio = !!asistio;
    await inscripcion.save();

    //auditoria
    req.auditoriaMensaje = `Se marcó asistencia (${inscripcion.asistio ? 'presente' : 'ausente'}) de ${inscripcion.socio?.razonSocial || 'un socio'} en el evento #${eventoId}`;
    req.auditoriaCodigo = 'MARCAR_ASISTENCIA_EVENTO';

    res.status(200).json({ exito: true, mensaje: 'Asistencia actualizada.', data: inscripcion });
  } catch (error) {
    console.error('Error al marcar asistencia:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 11. DESCARGAR MI PROPIO CERTIFICADO (Socio logueado)
// ==========================================
export const descargarMiCertificado = async (req, res) => {
  try {
    const { id } = req.params; // ID del evento
    const usuarioId = req.usuario.id;

    const evento = await Evento.findByPk(id);
    if (!evento) {
      return res.status(404).json({ exito: false, mensaje: 'Evento no encontrado.' });
    }

    if (evento.estado !== 'finalizado') {
      return res.status(400).json({ exito: false, mensaje: 'El certificado solo está disponible una vez que el evento finalizó.' });
    }

    const inscripcion = await Inscripcion.findOne({
      where: { evento_id: id, usuario_id: usuarioId },
      include: [{ model: User, as: 'socio', attributes: ['razonSocial'] }],
    });

    if (!inscripcion) {
      return res.status(404).json({ exito: false, mensaje: 'No tenés una inscripción registrada en este evento.' });
    }

    if (!inscripcion.asistio) {
      return res.status(400).json({ exito: false, mensaje: 'Tu asistencia todavía no fue confirmada por la administración.' });
    }

    const pdfBuffer = await generarCertificadoAsistencia({ socio: inscripcion.socio, evento });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificado-${evento.titulo.replace(/\s+/g, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar el certificado:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor al generar el certificado.' });
  }
};

// ==========================================
// 12. DESCARGAR CERTIFICADO DE UN SOCIO PUNTUAL (Admin — para reimprimir)
// ==========================================
export const descargarCertificadoAdmin = async (req, res) => {
  try {
    const { eventoId, inscripcionId } = req.params;

    const evento = await Evento.findByPk(eventoId);
    if (!evento) {
      return res.status(404).json({ exito: false, mensaje: 'Evento no encontrado.' });
    }

    const inscripcion = await Inscripcion.findOne({
      where: { id: inscripcionId, evento_id: eventoId },
      include: [{ model: User, as: 'socio', attributes: ['razonSocial'] }],
    });

    if (!inscripcion) {
      return res.status(404).json({ exito: false, mensaje: 'Inscripción no encontrada para este evento.' });
    }

    if (!inscripcion.asistio) {
      return res.status(400).json({ exito: false, mensaje: 'Este socio no tiene asistencia confirmada en este evento.' });
    }

    const pdfBuffer = await generarCertificadoAsistencia({ socio: inscripcion.socio, evento });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificado-${evento.titulo.replace(/\s+/g, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar el certificado:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor al generar el certificado.' });
  }
};
