import dayjs from "@/shared/utils/fechas";

export function iniciales(nombre = "") {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  if (!palabras.length) return "?";
  return palabras.slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

const TAMANOS = { Micro: "Micro (1-9)", Pequena: "Pequeña (10-49)", Mediana: "Mediana (50-200)", Grande: "Grande" };
export const etiquetaTamano = (tamano) => TAMANOS[tamano] || tamano || "";

export const ESTADOS_SOCIO = {
  aprobado: { texto: "Socio activo", punto: "bg-emerald-300" },
  pendiente: { texto: "Pendiente de aprobación", punto: "bg-amber-300" },
  rechazado: { texto: "Solicitud rechazada", punto: "bg-red-300" },
  inactivo: { texto: "Cuenta inactiva", punto: "bg-gray-300" },
};

export const esConstanciaSegura = (url) => typeof url === "string" && url.startsWith("https://res.cloudinary.com/");

export function datosAntiguedad(fechaAlta) {
  if (!fechaAlta || !dayjs(fechaAlta).isValid()) return { desde: "", antiguedad: "" };
  const meses = dayjs().diff(dayjs(fechaAlta), "month");
  let antiguedad = "Recién registrada";
  if (meses >= 12) {
    const anios = Math.floor(meses / 12);
    antiguedad = `${anios} ${anios === 1 ? "año" : "años"}`;
  } else if (meses >= 1) {
    antiguedad = `${meses} ${meses === 1 ? "mes" : "meses"}`;
  }
  return { desde: dayjs(fechaAlta).format("MMMM [de] YYYY"), antiguedad };
}