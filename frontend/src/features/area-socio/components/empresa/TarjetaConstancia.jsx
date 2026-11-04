import { FaArrowUpRightFromSquare, FaFilePdf, FaFolderOpen } from "react-icons/fa6";
import { esConstanciaSegura } from "../../utils/empresa";

export default function TarjetaConstancia({ url, cargando = false, className = "" }) {
  const disponible = esConstanciaSegura(url);

  return (
    <section
      className={`flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6 ${className}`}
    >
      <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
          <FaFolderOpen />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-navy">
          Documentación
        </h2>
      </div>

      <div className="flex flex-1 items-center gap-3.5 rounded-xl border border-primary/15 bg-surface-blue/40 p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-lg text-[#c0392b] shadow-2xs ring-1 ring-slate-200/70">
          <FaFilePdf />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">Constancia AFIP / DGR</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {disponible
              ? "Documento respaldatorio cargado"
              : cargando
              ? "Cargando constancia..."
              : "No hay constancia cargada"}
          </p>
        </div>
        {disponible && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-primary-dark sm:text-sm"
          >
            Ver PDF <FaArrowUpRightFromSquare className="text-xs" />
          </a>
        )}
      </div>
    </section>
  );
}
