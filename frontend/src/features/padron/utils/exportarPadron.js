/** Genera y descarga el Excel del padrón. xlsx se carga recién al exportar. */
export async function exportarPadronExcel(socios) {
  const XLSX = await import("xlsx");

  const filas = socios.map((s) => ({
    "Razón Social": s.razonSocial,
    CUIT: s.cuit,
    Email: s.email,
    "Categoría": s.categoria,
    Rubro: s.rubro,
    Localidad: s.localidad,
    "Teléfono": s.telefono,
    Estado: s.estado,
  }));

  const hoja = XLSX.utils.json_to_sheet(filas);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Padrón Socios");
  XLSX.writeFile(libro, "Padron_Socios_CAPYMEF.xlsx");
}
