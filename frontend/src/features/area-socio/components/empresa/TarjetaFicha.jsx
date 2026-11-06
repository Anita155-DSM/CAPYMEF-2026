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

function Item({ icono: Icono, etiqueta, valor, copiable, completo, cargando }) {
  return (
    <div
      className={`group flex items-center gap-3.5 rounded-none border border-slate-100 bg-surface/65 p-3.5 transition-colors hover:border-primary/20 hover:bg-surface-blue/40 ${
        completo ? "sm:col-span-2" : ""
      }`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-primary shadow-2xs ring-1 ring-primary/10">
        <Icono />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {etiqueta}
        </dt>
        <dd className="mt-0.5 break-words text-sm font-semibold text-navy sm:text-[15px]">
          {valor || (
            <span className="font-normal text-slate-400">
              {cargando ? "Cargando..." : "No informado"}
            </span>
          )}
        </dd>
      </div>
      {copiable && valor && (
        <button
          type="button"
          onClick={() => copiar(valor, etiqueta)}
          aria-label={`Copiar ${etiqueta}`}
          title={`Copiar ${etiqueta}`}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-primary focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <FaRegCopy />
        </button>
      )}
    </div>
  );
}

export default function TarjetaFicha({
  titulo,
  icono: Icono,
  accion,
  insignia,
  datos,
  columnas = 2,
  cargando = false,
  pie,
}) {
  const IconoAccion = accion?.icono;
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-none border border-slate-200/90 bg-white shadow-xs">
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
              <Icono />
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-navy">
              {titulo}
            </h2>
          </div>
          {accion && (
            <button
              type="button"
              onClick={accion.onClick}
              className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-primary/25 bg-surface-blue/60 px-3.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white sm:text-sm"
            >
              {IconoAccion && <IconoAccion />} {accion.texto}
            </button>
          )}
          {!accion && insignia}
        </div>

        <dl
          className={`grid flex-1 gap-3.5 ${
            columnas === 2 ? "sm:grid-cols-2" : ""
          }`}
        >
          {datos.map((dato) => (
            <Item key={dato.etiqueta} {...dato} cargando={cargando} />
          ))}
        </dl>
      </div>
      {pie}
    </section>
  );
}
