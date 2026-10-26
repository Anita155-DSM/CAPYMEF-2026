import { FaBell, FaCircleCheck, FaClock, FaMoneyBillWave, FaTriangleExclamation } from "react-icons/fa6";

/** Ícono y color según el `tipo` que manda el backend. Los tipos nuevos caen en "default". */
const ESTILOS_TIPO = {
  cuota_nueva: { Icono: FaMoneyBillWave, clase: "bg-blue-100 text-blue-600" },
  recordatorio_cuota: { Icono: FaClock, clase: "bg-amber-100 text-amber-600" },
  cuota_vencida: { Icono: FaTriangleExclamation, clase: "bg-red-100 text-red-600" },
  pago_registrado: { Icono: FaCircleCheck, clase: "bg-green-100 text-green-600" },
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
