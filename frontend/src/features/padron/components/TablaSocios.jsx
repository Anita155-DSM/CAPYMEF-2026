/**
 * Listado del padrón. Se adapta al ancho de pantalla:
 *  - md+  : tabla.
 *  - menor: una tarjeta por socio (la 1ª columna es el título y las columnas
 *           con `centrada: true` —las de acciones— quedan abajo como botones).
 *
 *   columnas: [{ titulo, render: (socio) => nodo, className?, centrada? }]
 */
export default function TablaSocios({ columnas, socios, mensajeVacio }) {
  const [principal, ...resto] = columnas;
  const datos = resto.filter((c) => !c.centrada);
  const acciones = resto.filter((c) => c.centrada);

  if (socios.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 py-6 px-4 text-center text-gray-500 font-medium">
        {mensajeVacio}
      </div>
    );
  }

  return (
    <>
      {/* CELULAR / TABLET CHICA: tarjetas */}
      <ul className="md:hidden flex flex-col gap-3">
        {socios.map((socio) => (
          <li key={socio.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="text-base font-bold text-navy wrap-break-word">{principal.render(socio)}</div>

            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {datos.map((c) => (
                <div key={c.titulo} className="contents">
                  <dt className="font-semibold text-gray-500">{c.titulo}</dt>
                  <dd className="text-gray-700 wrap-break-word min-w-0">{c.render(socio)}</dd>
                </div>
              ))}
            </dl>

            {acciones.length > 0 && (
              <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3">
                {acciones.map((c) => (
                  <div key={c.titulo}>{c.render(socio)}</div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* MD+: tabla (con scroll horizontal si no entra) */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-x-auto border border-gray-200">
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
            {socios.map((socio) => (
              <tr key={socio.id} className="border-b hover:bg-gray-50 transition-colors">
                {columnas.map((c) => (
                  <td key={c.titulo} className={`py-3 px-4 ${c.centrada ? "text-center" : ""} ${c.className ?? "text-gray-600"}`}>
                    {c.render(socio)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
