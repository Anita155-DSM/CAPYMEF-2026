import { FaClipboardCheck } from "react-icons/fa6";

/**
 * Listado del padrón y solicitudes. Se adapta al ancho de pantalla:
 *  - lg+  : tabla completa.
 *  - menor: una tarjeta por socio (la 1ª columna es el título y las columnas
 *           con `centrada: true` —las de acciones— quedan abajo como botones).
 *
 *   columnas: [{ titulo, render: (socio) => nodo, className?, centrada? }]
 */
export default function TablaSocios({
  columnas,
  socios,
  mensajeVacio,
  subtituloVacio,
  iconoVacio: IconoVacio = FaClipboardCheck,
}) {
  const [principal, ...resto] = columnas;
  const datos = resto.filter((c) => !c.centrada);
  const acciones = resto.filter((c) => c.centrada);

  if (socios.length === 0) {
    return (
      <div className="rounded-none border border-slate-200/90 bg-white py-16 px-4 text-center shadow-xs">
        <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-surface-blue text-2xl text-primary">
          <IconoVacio />
        </span>
        <p className="font-semibold text-navy">{mensajeVacio}</p>
        {subtituloVacio && <p className="mt-1 text-xs text-slate-500">{subtituloVacio}</p>}
      </div>
    );
  }

  return (
    <>
      {/* CELULAR / TABLET: tarjetas responsivas */}
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:hidden">
        {socios.map((socio) => (
          <li
            key={socio.id}
            className="flex flex-col justify-between rounded-none border border-slate-200/90 bg-white p-4 shadow-xs sm:p-5"
          >
            <div>
              <div className="wrap-break-word text-base font-bold text-navy">
                {principal.render(socio)}
              </div>

              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs">
                {datos.map((c) => (
                  <div key={c.titulo} className="contents">
                    <dt className="font-semibold uppercase tracking-wider text-slate-400">
                      {c.titulo}
                    </dt>
                    <dd className="min-w-0 wrap-break-word text-slate-700">{c.render(socio)}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {acciones.length > 0 && (
              <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                {acciones.map((c) => (
                  <div key={c.titulo}>{c.render(socio)}</div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* LG+: tabla con scroll horizontal suave si hace falta */}
      <div className="hidden overflow-x-auto rounded-none border border-slate-200/90 bg-white shadow-xs lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-surface text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {columnas.map((c) => (
                <th key={c.titulo} className={`px-4 py-3.5 ${c.centrada ? "text-right" : ""}`}>
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {socios.map((socio) => (
              <tr key={socio.id} className="transition-colors hover:bg-surface-blue/35">
                {columnas.map((c) => (
                  <td
                    key={c.titulo}
                    className={`px-4 py-3.5 ${c.centrada ? "text-right" : ""} ${
                      c.className ?? "text-slate-600"
                    }`}
                  >
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
