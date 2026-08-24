import { Auditoria } from '../models/auditoria.models.js';

export const interceptorAuditoria = (req, res, next) => {
  // Solo interceptamos operaciones que modifican datos (POST, PUT, DELETE)
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    
    // Escuchamos el evento cuando la respuesta termina de enviarse al usuario
    res.on('finish', async () => {
      // Solo guardamos si la respuesta del controlador fue exitosa (código 200 al 299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // 1. Deducir tipo de acción por método HTTP
          const tipos = { POST: 'CREACION', PUT: 'MODIFICACION', DELETE: 'ELIMINACION' };
          const accionTipo = tipos[req.method] || 'ACCION';

          // 2. Deducir módulo desde la URL (ej: '/api/admin/usuarios' -> 'ADMIN')
          const partesRuta = req.originalUrl.split('?')[0].split('/').filter(Boolean);
          const modulo = partesRuta[1] ? partesRuta[1].toUpperCase() : 'GENERAL';

          // 3. Obtener mensaje personalizado o generar uno por defecto
          const descripcion = req.auditoriaMensaje || `Operación de ${accionTipo.toLowerCase()} realizada en el módulo ${modulo}.`;
          const codigoTecnico = req.auditoriaCodigo || `${req.method}_${modulo}`;

          // 4. Guardar en PostgreSQL
          // OJO: authMiddleware.js guarda los datos del token en req.usuario (en español),
          // por eso acá leemos de ahí y no de req.user (antes nunca coincidían y todo quedaba como "Sistema")
          await Auditoria.create({
            usuarioId: req.usuario?.id || null,
            usuarioNombre: req.usuario ? `${req.usuario.nombre || req.usuario.razonSocial || 'Usuario'}` : 'Sistema',
            usuarioRol: req.usuario?.rol || req.usuario?.categoria || 'SISTEMA',
            modulo,
            accionTipo,
            codigoTecnico,
            descripcion,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
          });

        } catch (error) {
          console.error('Error al registrar auditoría en PostgreSQL:', error);
        }
      }
    });
  }

  next();
};