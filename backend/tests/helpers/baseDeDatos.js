import { sequelize } from '../../config/database.js';
import { User } from '../../models/user.models.js';
import { Cuota } from '../../models/cuota.models.js';
import { Noticia } from '../../models/noticia.models.js';
import '../../models/notificacion.models.js';

// Crea (o recrea) todas las tablas vacías en la base SQLite en memoria.
// Se llama en un beforeEach para que cada test arranque limpio y no dependa del anterior.
export const reiniciarBase = () => sequelize.sync({ force: true });

export const cerrarBase = () => sequelize.close();

// Cuit y email son únicos: un contador evita choques cuando un test crea varios usuarios.
let contador = 0;

// Crea un usuario con todos los campos obligatorios completos. Cada test pisa solo
// lo que le importa (categoría, estado, rol...), así se lee qué es lo relevante.
export const crearUsuario = (datos = {}) => {
  contador++;
  return User.create({
    razonSocial: `Empresa de prueba ${contador}`,
    cuit: `20-0000000${contador}-1`,
    email: `usuario${contador}@test.com`,
    password: 'no-importa-en-estos-tests',
    telefono: '3704000000',
    localidad: 'Formosa',
    rubro: 'Comercio',
    categoria: 'activo',
    estado: 'aprobado',
    rol: 'socio',
    ...datos,
  });
};

// Crea `cantidad` cuotas de un usuario en el estado indicado, en meses distintos.
export const crearCuotas = (usuarioId, cantidad, estado) =>
  Promise.all(
    Array.from({ length: cantidad }, (_, i) => {
      const mes = String(i + 1).padStart(2, '0');
      return Cuota.create({
        usuario_id: usuarioId,
        mes_anio: `2026-${mes}`,
        monto: 10000,
        fecha_vencimiento: `2026-${mes}-10`,
        estado,
      });
    })
  );

export const crearNoticia = (datos = {}) =>
  Noticia.create({
    titulo: 'Noticia de prueba',
    contenido: 'Contenido de prueba',
    ...datos,
  });
