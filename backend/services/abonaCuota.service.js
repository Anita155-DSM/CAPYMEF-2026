// ==========================================
// Quién paga cuota: regla única
// ==========================================
// Por qué existe: las cuentas con rol 'admin' son cuentas de GESTIÓN (Presidente, Secretario, Tesorero),
// no socios. Antes el generador solo miraba que la cuenta estuviera aprobada y su tarifa, así que a un
// admin con categoría Activo se le generaba cuota, recibía avisos de vencimiento, contaba en la morosidad
// y hasta podía ser degradado por mora. La regla vive acá, en un solo lugar, para que todos los cálculos
// decidan igual:
//   - Una cuenta de gestión (admin) nunca paga cuota.
//   - Para el resto manda la tarifa de su categoría: paga si es mayor a 0 (hoy Activos sí; Adherentes,
//     Honorarios y Padrinos tienen tarifa 0, ver tarifa.service.js).

import { Op } from 'sequelize';

export const ROL_CUENTA_DE_GESTION = 'admin';

export const esCuentaDeGestion = (usuario) => usuario?.rol === ROL_CUENTA_DE_GESTION;

// usuario: { rol, categoria } · tarifas: { activo: 10000, adherente: 0, ... } (obtenerMapaDeTarifas).
// Sin tarifa cargada para la categoría devuelve false: no se adivina un monto.
export const abonaCuota = (usuario, tarifas) => {
  if (!usuario || esCuentaDeGestion(usuario)) return false;
  const monto = Number(tarifas?.[usuario.categoria]);
  return Number.isFinite(monto) && monto > 0;
};

// Filtro para el WHERE de User (o de un include de User) que deja afuera a las cuentas de gestión.
// Contempla rol null a propósito: en SQL "rol <> 'admin'" descarta también los NULL, y un socio con el
// rol sin cargar no debe desaparecer de los cálculos. Va dentro de Op.and para poder combinarse con
// otros filtros que ya usan Op.or sin pisarlos.
export const FILTRO_SOLO_SOCIOS = {
  [Op.and]: [{ [Op.or]: [{ rol: { [Op.ne]: ROL_CUENTA_DE_GESTION } }, { rol: null }] }],
};

// Include listo para consultas de Cuota: solo cuotas de socios (no de cuentas de gestión).
// paranoid: false para que las cuotas de un usuario borrado lógicamente se sigan procesando como antes.
export const INCLUDE_SOLO_SOCIOS = [{ association: 'socio', attributes: [], where: FILTRO_SOLO_SOCIOS, paranoid: false }];
