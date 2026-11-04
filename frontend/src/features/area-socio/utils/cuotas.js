// Formato y reglas de las cuotas del socio.

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "2026-09" → "septiembre de 2026" */
export function formatearPeriodo(mesAnio) {
  const [anio, mes] = String(mesAnio || "").split("-");
  const nombreMes = MESES[Number(mes) - 1];
  return nombreMes ? `${nombreMes} de ${anio}` : mesAnio || "-";
}

/** 5000 → "$ 5.000,00" */
export const formatearMonto = (monto) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(monto) || 0);

/** "2026-09-10" → "10/09/2026" (sin pasar por Date, así no hay corrimiento de zona horaria) */
export function formatearFechaCuota(fecha) {
  if (!fecha) return "-";
  const [anio, mes, dia] = String(fecha).slice(0, 10).split("-");
  return dia ? `${dia}/${mes}/${anio}` : "-";
}

export const ordenarPorPeriodo = (cuotas = []) =>
  [...cuotas].sort((a, b) => String(b.mes_anio).localeCompare(String(a.mes_anio)));

/** La cuota "actual": la impaga más vieja o, si está todo pago, la más reciente. */
export function elegirCuotaActual(cuotas = []) {
  const ordenadas = ordenarPorPeriodo(cuotas);
  const impagas = ordenadas.filter((c) => c.estado !== "pagada");
  return impagas.length ? impagas[impagas.length - 1] : ordenadas[0] || null;
}

export const ESTILOS_ESTADO_CUOTA = {
  pagada: { texto: "Pagada", clase: "bg-[#61d5a5] text-[#247c5c]" },
  pendiente: { texto: "Pendiente", clase: "bg-[#ffd58f] text-[#a16b18]" },
  vencida: { texto: "Vencida", clase: "bg-[#f7b4a2] text-[#9b3418]" },
};

export const mayuscula = (texto) => (texto ? texto.replace(/^./, (l) => l.toUpperCase()) : "");

/**
 * Solo los socios "Activos" abonan cuota social mensual.
 * Adherentes, Honorarios y Padrinos (contribución eventual) no abonan cuota periódica.
 */
export const abonaCuotaSocial = (categoria) =>
  String(categoria || "").trim().toLowerCase() === "activo";
