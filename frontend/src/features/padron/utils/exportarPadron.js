import { etiquetaTamano } from "@/features/area-socio/utils/empresa";

/** Genera y descarga el Excel del padrón. xlsx se carga recién al exportar. */
export async function exportarPadronExcel(socios) {
  const XLSX = await import("xlsx");

  const filas = socios.map((s) => ({
    "Razón Social": s.razonSocial || "-",
    CUIT: s.cuit || "-",
    Email: s.email || "-",
    Teléfono: s.telefono || "-",
    Categoría: s.categoria || "-",
    Rubro: s.rubro || "-",
    "Tamaño de Empresa": etiquetaTamano(s.tamano_empresa),
    Actividad: s.actividad || "-",
    Localidad: s.localidad || "-",
    Estado: s.estado || "-",
  }));

  const hoja = XLSX.utils.json_to_sheet(filas);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Padrón Socios");
  XLSX.writeFile(libro, "Padron_Socios_CAPYMEF.xlsx");
}
