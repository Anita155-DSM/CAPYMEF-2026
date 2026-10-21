import { FaRegCopy } from "react-icons/fa6";
import { toast } from "sonner";

async function copiar(texto, etiqueta) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success(`${etiqueta} copiado.`);
  } catch {
    toast.error("No se pudo copiar. Seleccionalo y copialo a mano.");
  }
}

function Item({ icono: Icono, etiqueta, valor, copiable, completo }) {
  return (
    <div className={`group flex items-start gap-3 ${completo ? "sm:col-span-2" : ""}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-blue text-primary">
        <Icono />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{etiqueta}</dt>
        <dd className="mt-0.5 break-words text-[15px] font-semibold text-navy">
          {valor || <span className="font-normal text-gray-400">No informado</span>}
        </dd>
      </div>
      {copiable && valor && (
        <button
          type="button"
          onClick={() => copiar(valor, etiqueta)}
          aria-label={`Copiar ${etiqueta}`}
          title={`Copiar ${etiqueta}`}
          className="mt-1 rounded-md p-2 text-gray-400 transition hover:bg-surface-blue hover:text-primary focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <FaRegCopy />
        </button>
      )}
    </div>
  );
}


export default function TarjetaFicha({ titulo, icono: Icono, accion, insignia, datos, columnas = 2, pie }) {
  const IconoAccion = accion?.icono;
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <h2 className="flex items-center gap-2.5 text-base font-bold uppercase tracking-wide text-gray-700">
            <Icono className="text-primary" /> {titulo}
          </h2>
          {accion && (
            <button
              type="button"
              onClick={accion.onClick}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-primary/30 px-3 py-1.5 text-sm font-bold text-primary transition-colors hover:bg-surface-blue"
            >
              {IconoAccion && <IconoAccion />} {accion.texto}
            </button>
          )}
          {!accion && insignia}
        </div>
        {/* content-evenly: si la tarjeta se estira, el espacio sobrante se reparte entre las filas */}
        <dl className={`grid flex-1 content-evenly gap-x-6 gap-y-5 ${columnas === 2 ? "sm:grid-cols-2" : ""}`}>
          {datos.map((dato) => (
            <Item key={dato.etiqueta} {...dato} />
          ))}
        </dl>
      </div>
      {pie}
    </section>
  );
}