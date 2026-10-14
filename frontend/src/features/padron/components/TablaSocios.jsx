/**
 * Tabla genérica del padrón.
 *   columnas: [{ titulo, render: (socio) => nodo, className?, centrada? }]
 */
export default function TablaSocios({ columnas, socios, mensajeVacio }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-navy text-white">
            {columnas.map((c) => (
              <th key={c.titulo} className={`py-3 px-4 font-semibold text-sm ${c.centrada ? "text-center" : ""}`}>
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {socios.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} className="py-6 text-center text-gray-500 font-medium">
                {mensajeVacio}
              </td>
            </tr>
          ) : (
            socios.map((socio) => (
              <tr key={socio.id} className="border-b hover:bg-gray-50 transition-colors">
                {columnas.map((c) => (
                  <td key={c.titulo} className={`py-3 px-4 ${c.centrada ? "text-center" : ""} ${c.className ?? "text-gray-600"}`}>
                    {c.render(socio)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
