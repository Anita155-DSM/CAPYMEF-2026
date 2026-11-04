import {
  FaArrowTrendDown,
  FaArrowTrendUp,
  FaBell,
  FaCheckDouble,
  FaCircleCheck,
  FaClock,
  FaHourglassHalf,
  FaMoneyBillWave,
  FaTriangleExclamation,
  FaUserCheck,
  FaUserMinus,
} from "react-icons/fa6";

/**
 * Ícono y color según el `tipo` que manda el backend (11 tipos hoy).
 * Los tipos nuevos que se agreguen en el backend caen en "default" hasta sumarlos acá.
 */
const ESTILOS_TIPO = {
  // Para el socio
  cuota_nueva: { Icono: FaMoneyBillWave, clase: "bg-blue-100 text-blue-600" },
  recordatorio_cuota: { Icono: FaClock, clase: "bg-amber-100 text-amber-600" },
  cuota_vencida: { Icono: FaTriangleExclamation, clase: "bg-red-100 text-red-600" },
  pago_registrado: { Icono: FaCircleCheck, clase: "bg-green-100 text-green-600" },
  pago_confirmado: { Icono: FaCheckDouble, clase: "bg-emerald-100 text-emerald-700" },
  categoria_degradada: { Icono: FaArrowTrendDown, clase: "bg-red-100 text-red-600" },
  categoria_recuperada: { Icono: FaArrowTrendUp, clase: "bg-green-100 text-green-600" },
  // Para administradores
  pago_por_confirmar: { Icono: FaHourglassHalf, clase: "bg-amber-100 text-amber-600" },
  resumen_vencidas: { Icono: FaTriangleExclamation, clase: "bg-red-100 text-red-600" },
  socio_degradado: { Icono: FaUserMinus, clase: "bg-red-100 text-red-600" },
  socio_recuperado: { Icono: FaUserCheck, clase: "bg-green-100 text-green-600" },
  default: { Icono: FaBell, clase: "bg-gray-100 text-gray-500" },
};

export const estiloDeTipo = (tipo) => ESTILOS_TIPO[tipo] ?? ESTILOS_TIPO.default;

/** "2026-10-26T13:00:00Z" → "hace 5 min", "hace 3 h", "ayer", "hace 4 días" o "12/09/2026" */
export function tiempoRelativo(fecha, ahora = Date.now()) {
  const momento = new Date(fecha).getTime();
  if (Number.isNaN(momento)) return "";

  const minutos = Math.max(0, Math.floor((ahora - momento) / 60000));
  if (minutos < 1) return "ahora";
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ayer";
  if (dias < 7) return `hace ${dias} días`;

  return new Date(momento).toLocaleDateString("es-AR");
}

/** Solo rutas internas ("/socios/pagos"): nunca seguimos un enlace externo que venga del servidor. */
export const enlaceInterno = (enlace) =>
  typeof enlace === "string" && /^\/(?!\/)/.test(enlace) ? enlace : null;

/**
 * Pantalla a la que lleva cada tipo. El backend hoy NO manda `enlace` en ninguna notificación,
 * así que sin esto tocar una solo la marcaba como leída y no llevaba a ningún lado.
 * Si algún día el backend manda `enlace`, ese tiene prioridad.
 */
const DESTINO_POR_TIPO = {
  cuota_nueva: "/socios/pagos",
  recordatorio_cuota: "/socios/pagos",
  cuota_vencida: "/socios/pagos",
  pago_registrado: "/socios/pagos",
  pago_confirmado: "/socios/pagos",
  categoria_degradada: "/socios/empresa",
  categoria_recuperada: "/socios/empresa",
  pago_por_confirmar: "/admin/finanzas",
  resumen_vencidas: "/admin/finanzas",
  socio_degradado: "/admin/socios",
  socio_recuperado: "/admin/socios",
};

export const destinoDeNotificacion = (notificacion) =>
  enlaceInterno(notificacion.enlace) ?? DESTINO_POR_TIPO[notificacion.tipo] ?? null;