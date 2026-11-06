// Textos y estilos del listado de cuotas del admin.
// formatearMonto / mayuscula salen de area-socio para no repetir lógica.
export { formatearMonto, mayuscula } from "@/features/area-socio/utils/cuotas";

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const separar = (mesAnio) => String(mesAnio || "").split("-");

/** "2026-08" → "Cuota Ago 2026" */
export function nombreCuota(mesAnio) {
  const [anio, mes] = separar(mesAnio);
  const corto = MESES_CORTOS[Number(mes) - 1];
  return corto ? `Cuota ${corto} ${anio}` : `Cuota ${mesAnio || "-"}`;
}

/** "2026-08" → "Agosto 2026" (para el filtro de período) */
export function nombrePeriodo(mesAnio) {
  const [anio, mes] = separar(mesAnio);
  const largo = MESES[Number(mes) - 1];
  return largo ? `${largo} ${anio}` : mesAnio || "-";
}

/** "2026-11-10" → "10/11/2026" */
export function formatearFechaCorta(fechaIso) {
  if (!fechaIso) return null;
  const partes = String(fechaIso).slice(0, 10).split("-");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  const fecha = new Date(fechaIso);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toLocaleDateString("es-AR");
}

export const ESTADOS_CUOTA = {
  pagada: { texto: "PAGADO", punto: "bg-green-500" },
  pendiente: { texto: "PENDIENTE", punto: "bg-yellow-400" },
  vencida: { texto: "VENCIDO", punto: "bg-red-600" },
};

export const OPCIONES_ESTADO = [
  { valor: "todos", texto: "Todos" },
  { valor: "pagada", texto: "Pagada" },
  { valor: "pendiente", texto: "Pendiente" },
  { valor: "vencida", texto: "Vencida" },
];

export const OPCIONES_CATEGORIA_CUOTA = [
  { valor: "todas", texto: "Todas" },
  { valor: "activo", texto: "Activo" },
  { valor: "adherente", texto: "Adherente" },
  { valor: "padrino", texto: "Padrino" },
  { valor: "honorario", texto: "Honorario" },
];
