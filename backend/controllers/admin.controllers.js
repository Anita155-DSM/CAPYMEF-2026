import User from '../models/user.models.js'; // Ajusta la ruta a tu modelo Sequelize

// Obtener todos los usuarios que están esperando aprobación
export const obtenerSolicitudesPendientes = async (req, res) => {
  try {
    const solicitudes = await User.findAll({
      where: { estado_registro: 'Pendiente' },
      attributes: ['id', 'razonSocial', 'email', 'telefono', 'categoria', 'createdAt'] // No traemos contraseñas
    });

    res.status(200).json({
      exito: true,
      data: solicitudes
    });
  } catch (error) {
    console.error('Error al obtener solicitudes:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

// Aprobar o Rechazar una solicitud
export const gestionarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevoEstado } = req.body; // Debe ser 'Aprobado' o 'Rechazado'

    if (!['Aprobado', 'Rechazado'].includes(nuevoEstado)) {
      return res.status(400).json({ exito: false, mensaje: 'Estado inválido.' });
    }

    const usuario = await User.findByPk(id);
    
    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: 'Usuario no encontrado.' });
    }

    usuario.estado_registro = nuevoEstado;
    await usuario.save();

    res.status(200).json({
      exito: true,
      mensaje: `La cuenta de ${usuario.razonSocial} ha sido ${nuevoEstado} exitosamente.`
    });
  } catch (error) {
    console.error('Error al gestionar solicitud:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};