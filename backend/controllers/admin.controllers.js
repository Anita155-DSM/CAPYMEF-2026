// IMPORTANTE: Importamos usando las llaves {} porque no hay un export default en el modelo
import { User } from "../models/user.models.js"; 

// Obtener todos los usuarios que están esperando aprobación
export const obtenerSolicitudesPendientes = async (req, res) => {
  try {
    const solicitudes = await User.findAll({
      // Usamos el campo unificado 'estado' (en minúscula como en el modelo)
      where: { estado: "pendiente" },
      attributes: [
        "id",
        "razonSocial",
        "email",
        "telefono",
        "categoria",
        "createdAt",
      ], 
    });

    res.status(200).json({
      exito: true,
      data: solicitudes,
    });
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).json({ exito: false, mensaje: "Error interno del servidor." });
  }
};

// Aprobar o Rechazar una solicitud
export const gestionarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevoEstado } = req.body; 

    // Validamos en minúscula, que es lo que espera tu Base de Datos ahora
    if (!["aprobado", "rechazado"].includes(nuevoEstado)) {
      return res.status(400).json({ exito: false, mensaje: "Estado inválido." });
    }

    const usuario = await User.findByPk(id);

    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: "Usuario no encontrado." });
    }

    // Actualizamos el campo unificado
    usuario.estado = nuevoEstado;
    await usuario.save();

    res.status(200).json({
      exito: true,
      mensaje: `La cuenta de ${usuario.razonSocial} ha sido pasada a ${nuevoEstado} exitosamente.`,
    });
  } catch (error) {
    console.error("Error al gestionar solicitud:", error);
    res.status(500).json({ exito: false, mensaje: "Error interno del servidor." });
  }
};

// Dar de baja/Desactivar a un socio
export const darDeBajaSocio = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await User.findByPk(id);

    if (!usuario) {
      return res.status(404).json({ exito: false, mensaje: "Usuario no encontrado." });
    }

    // Cambiamos su estado para que la barrera del login lo bloquee
    usuario.estado = "inactivo";
    await usuario.save();

    res.status(200).json({
      exito: true,
      mensaje: `El socio ${usuario.razonSocial} ha sido dado de baja correctamente.`,
    });
  } catch (error) {
    console.error("Error al dar de baja al socio:", error);
    res.status(500).json({ exito: false, mensaje: "Error interno del servidor." });
  }
};