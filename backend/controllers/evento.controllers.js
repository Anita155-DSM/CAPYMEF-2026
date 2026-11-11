import { Op } from 'sequelize';
import { v2 as cloudinary } from 'cloudinary';
import { Evento } from '../models/evento.models.js';
import { Inscripcion } from '../models/inscripcion.models.js';
import { User } from '../models/user.models.js';
import { generarCertificadoAsistencia } from '../services/certificado.service.js';
import { ocultarLugarSiCorresponde, tieneEnlacePrivado } from '../services/privacidadEvento.service.js';
import { contarInscriptos } from '../services/inscripcion.service.js';
import { fechaHoyArgentina } from '../services/cuota.service.js';
import { sequelize } from '../config/database.js';

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

// Arma el listado que ven los usuarios logueados: cada evento con `yaInscripto` y con el link de la
// reunión solo si quien consulta es admin o está inscripto en ese evento (ver privacidadEvento.service.js).
// Lo usan /socios y /admin, así las dos respuestas tienen la misma forma.
const armarListadoParaUsuario = async (eventos, usuario) => {
  const inscripciones = await Inscripcion.findAll({ where: { usuario_id: usuario.id } });
  const idsInscriptos = new Set(inscripciones.map((i) => i.evento_id));
  const esAdmin = usuario.rol === 'admin';

  return eventos.map((evento) => {
    const yaInscripto = idsInscriptos.has(evento.id);
    return ocultarLugarSiCorresponde({ ...evento.toJSON(), yaInscripto }, esAdmin || yaInscripto);
  });
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

    // Sin login nadie puede ver el link de una reunión virtual.
    const data = eventos.map((evento) => ocultarLugarSiCorresponde(evento.toJSON(), false));

    res.status(200).json({ exito: true, data });
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

    // Un socio no inscripto no recibe el link de la reunión (antes lo recibía cualquier socio).
    const data = await armarListadoParaUsuario(eventos, req.usuario);

    res.status(200).json({ exito: true, data });
  } catch (error) {
    console.error('Error al obtener eventos para socios:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 2.b LISTADO COMPLETO PARA EL ADMIN (incluye cancelados)
// ==========================================
// Por qué existe: el panel admin usaba GET /socios, que excluye los cancelados, así que un evento
// cancelado desaparecía del panel y no se podía volver a editar ni borrar. Acá van TODOS, con el link
// completo (el admin lo necesita para editar el evento) y con la misma forma que /socios.
export const obtenerEventosAdmin = async (req, res) => {
  try {
    const eventos = await Evento.findAll({ order: [['fecha', 'ASC']] });
    const data = await armarListadoParaUsuario(eventos, req.usuario);

    res.status(200).json({ exito: true, data });
  } catch (error) {
    console.error('Error al obtener los eventos para el admin:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// ==========================================
// 3. OBTENER UN EVENTO POR ID (con cupo disponible calculado)
// ==========================================
// La ruta no exige login (verificarTokenOpcional): sin token, o con uno inválido, se responde como a un
// visitante anónimo, sin el link de una reunión virtual.
export const obtenerEventoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const evento = await Evento.findByPk(id);

    if (!evento) {
      return res.status(404).json({ exito: false, mensaje: 'Evento no encontrado.' });
    }

    const totalInscriptos = await contarInscriptos(id);
    // Nunca negativo (mínimo 0), igual que en resumen-inicio: si hubiera más inscriptos que cupo (datos viejos,
    // anteriores al control de la edición), se muestra "sin lugares" y no un número que no tiene sentido.
    const cupoDisponible = evento.cupoMaximo != null ? Math.max(evento.cupoMaximo - totalInscriptos, 0) : null;

    // Solo se consulta la inscripción si hace falta (evento con link privado y alguien logueado).
    let puedeVerEnlace = req.usuario?.rol === 'admin';
    if (!puedeVerEnlace && req.usuario && tieneEnlacePrivado(evento)) {
      puedeVerEnlace = Boolean(await Inscripcion.findOne({ where: { evento_id: id, usuario_id: req.usuario.id } }));
    }

    res.status(200).json({
      exito: true,
      data: ocultarLugarSiCorresponde({ ...evento.toJSON(), totalInscriptos, cupoDisponible }, puedeVerEnlace),
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

    // Va en una transacción que bloquea la fila del evento, igual que inscribirseEvento: así ninguna inscripción
    // se puede colar entre el conteo de inscriptos y el guardado del cupo nuevo (la inscripción espera a que
    // esta edición termine, y después cuenta con el cupo ya cambiado).
    const resultado = await sequelize.transaction(async (transaction) => {
      const evento = await Evento.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });

      if (!evento) {
        return { status: 404, cuerpo: { exito: false, mensaje: 'Evento no encontrado.' } };
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

      // El cupo no puede quedar por debajo de los que ya están inscriptos: antes se guardaba (por ejemplo, cupo
      // 20 con 25 inscriptos) y el evento mostraba un cupo disponible negativo. Bajarlo justo al número de
      // inscriptos sí se permite (queda lleno), y subirlo o quitarlo (null = sin límite) siempre.
      // Solo se revisa si el cupo cambia: editar otro dato de un evento que ya estuviera excedido no se bloquea.
      if (evento.changed('cupoMaximo') && evento.cupoMaximo != null) {
        const inscriptos = await contarInscriptos(id, { transaction });
        if (Number(evento.cupoMaximo) < inscriptos) {
          return {
            status: 400,
            cuerpo: { exito: false, mensaje: `Ya hay ${inscriptos} inscriptos: el cupo no puede ser menor a ${inscriptos}.` },
          };
        }
      }

      // La imagen anterior se borra de Cloudinary recién DESPUÉS de guardar (ver abajo): antes se borraba
      // primero, y si el guardado fallaba el evento quedaba apuntando a una imagen que ya no existía.
      let publicIdAnterior = null;
      if (imagenFile) {
        if (evento.imagenUrl) publicIdAnterior = extraerPublicIdDeUrl(evento.imagenUrl);
        evento.imagenUrl = imagenFile.path;
      }

      await evento.save({ transaction });
      return { status: 200, evento, publicIdAnterior };
    });

    if (resultado.status !== 200) {
      // No se guardó nada: la imagen recién subida no la usa nadie.
      if (imagenFile) eliminarImagenCloudinary(imagenFile.filename);
      return res.status(resultado.status).json(resultado.cuerpo);
    }
    const { evento, publicIdAnterior } = resultado;
    if (publicIdAnterior) eliminarImagenCloudinary(publicIdAnterior);

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

    // Antes se contaban los inscriptos y después se creaba la inscripción por separado: si dos socios pedían el
    // último lugar al mismo tiempo, los dos contaban "queda 1" y entraban los dos (el evento quedaba con uno de
    // más). Ahora todo pasa en una transacción que empieza BLOQUEANDO la fila del evento (SELECT ... FOR UPDATE
    // en Postgres): el segundo pedido espera a que el primero termine y recién ahí cuenta, ya con la inscripción
    // nueva incluida. El bloqueo es solo de ese evento: las inscripciones a otros eventos no esperan.
    const resultado = await sequelize.transaction(async (transaction) => {
      const evento = await Evento.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });

      if (!evento) {
        return { status: 404, cuerpo: { exito: false, mensaje: 'Evento no encontrado.' } };
      }

      if (evento.estado !== 'programado') {
        return { status: 400, cuerpo: { exito: false, mensaje: 'Este evento ya no admite inscripciones.' } };
      }

      // Un evento que sigue 'programado' pero cuya fecha ya pasó (nadie lo marcó como finalizado) aceptaba
      // inscripciones. Se compara con la fecha de HOY en hora argentina (las dos son 'AAAA-MM-DD', así que se
      // comparan como texto): un evento de hoy todavía acepta inscripciones.
      if (evento.fecha < fechaHoyArgentina()) {
        return { status: 400, cuerpo: { exito: false, mensaje: 'El evento ya se realizó.' } };
      }

      // Verificamos que no esté ya inscripto
      const inscripcionExistente = await Inscripcion.findOne({
        where: { evento_id: id, usuario_id: usuarioId },
        transaction,
      });
      if (inscripcionExistente) {
        return { status: 400, cuerpo: { exito: false, mensaje: 'Ya estás inscripto a este evento.' } };
      }

      // Verificamos el cupo, si el evento tiene límite. Se cuenta DENTRO de la transacción, con el evento bloqueado.
      if (evento.cupoMaximo != null) {
        const totalInscriptos = await contarInscriptos(id, { transaction });
        if (totalInscriptos >= evento.cupoMaximo) {
          return { status: 400, cuerpo: { exito: false, mensaje: 'El cupo para este evento ya está completo.' } };
        }
      }

      const nuevaInscripcion = await Inscripcion.create({ evento_id: id, usuario_id: usuarioId }, { transaction });
      return { status: 201, evento, nuevaInscripcion };
    });

    if (resultado.status !== 201) {
      return res.status(resultado.status).json(resultado.cuerpo);
    }
    const { evento, nuevaInscripcion } = resultado;

    //auditoria
    req.auditoriaMensaje = `El usuario se inscribió al evento "${evento.titulo}"`;
    req.auditoriaCodigo = 'INSCRIPCION_EVENTO';

    res.status(201).json({
      exito: true,
      mensaje: 'Inscripción registrada correctamente.',
      data: nuevaInscripcion,
    });
  } catch (error) {
    // Respaldo del índice único (evento_id, usuario_id): si el mismo socio manda dos pedidos a la vez, la base
    // rechaza el segundo. Es el mismo caso que "ya estás inscripto", no un error del servidor.
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ exito: false, mensaje: 'Ya estás inscripto a este evento.' });
    }
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
