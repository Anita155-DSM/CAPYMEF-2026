// IMPORTANTE: Importamos usando las llaves {} porque no hay un export default en el modelo
import { User } from "../models/user.models.js"; 
import { fn, col, literal } from "sequelize";

// ============================================================================
// PANTALLA: DASHBOARD DE REPORTES (Gráficos y Geolocalización)
// ============================================================================

/**
 * Mapeo agrupado por Localidad para gráficos / mapa de distribución geográfica
 */
export const obtenerDistribucionPorLocalidad = async (req, res) => {
  try {
    const distribucion = await User.findAll({
      attributes: [
        "localidad",
        [fn("COUNT", col("id")), "cantidad"]
      ],
      where: { estado: "aprobado" }, // Contamos solo a los socios activos/aprobados
      group: ["localidad"],
      order: [[literal("cantidad"), "DESC"]]
    });

    res.status(200).json({
      exito: true,
      totalLocalidades: distribucion.length,
      data: distribucion,
    });
  } catch (error) {
    console.error("Error al obtener reporte por localidad:", error);
    res.status(500).json({
      exito: false,
      mensaje: "Error interno al recuperar la distribución por localidad.",
    });
  }
};

/**
 * Agrupamiento por Rubro para gráficos circulares / estadísticas del dashboard
 */
export const obtenerDistribucionPorRubro = async (req, res) => {
  try {
    const distribucion = await User.findAll({
      attributes: [
        "rubro",
        [fn("COUNT", col("id")), "cantidad"]
      ],
      where: { estado: "aprobado" },
      group: ["rubro"],
      order: [[literal("cantidad"), "DESC"]]
    });

    res.status(200).json({
      exito: true,
      totalRubros: distribucion.length,
      data: distribucion,
    });
  } catch (error) {
    console.error("Error al obtener reporte por rubro:", error);
    res.status(500).json({
      exito: false,
      mensaje: "Error interno al recuperar la distribución por rubro.",
    });
  }
};

// ==========================================
// OBTENER EL PADRÓN COMPLETO DE USUARIOS (SOCIOS)
// ==========================================
export const obtenerTodosLosUsuarios = async (req, res) => {
  try {
    // Obtenemos todos los registros excluyendo la contraseña por seguridad
    const usuarios = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]], // Los más recientes primero
    });

    res.status(200).json({
      exito: true,
      total: usuarios.length,
      data: usuarios,
    });
  } catch (error) {
    console.error("Error al obtener la lista de usuarios:", error);
    res.status(500).json({
      exito: false,
      mensaje: "Error interno del servidor al recuperar los usuarios.",
    });
  }
};

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