import { FaArrowUpRightFromSquare, FaFilePdf, FaFolderOpen } from "react-icons/fa6";
import { esConstanciaSegura } from "../../utils/empresa";

export default function TarjetaConstancia({ url, className = "" }) {
  const disponible = esConstanciaSegura(url);

  return (
    <section className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>
      <h2 className="mb-5 flex items-center gap-2.5 border-b border-gray-100 pb-4 text-base font-bold uppercase tracking-wide text-gray-700">
        <FaFolderOpen className="text-primary" /> Documentación
      </h2>
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-surface p-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg text-[#c0392b] shadow-sm">
          <FaFilePdf />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-navy">Constancia AFIP/DGR</p>
          <p className="text-xs text-gray-500">{disponible ? "Presentada al registrarte" : "No hay constancia cargada"}</p>
        </div>
        {disponible && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
          >
            Ver <FaArrowUpRightFromSquare className="text-xs" />
          </a>
        )}
      </div>
    </section>
  );
}