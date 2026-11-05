import { useState } from "react";
import {
  FaArrowUpRightFromSquare,
  FaEye,
  FaEyeSlash,
  FaFilePdf,
} from "react-icons/fa6";
import { esConstanciaSegura } from "@/features/area-socio/utils/empresa";
import VisorConstancia from "./VisorConstancia";

/**
 * Constancia AFIP/DGR que el socio adjuntó al registrarse.
 * Permite previsualizarla dentro del modal o abrirla en una pestaña nueva.
 */
export default function ConstanciaSocio({ url, razonSocial }) {
  const [visible, setVisible] = useState(false);
  const disponible = esConstanciaSegura(url);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg text-red-600 shadow-2xs ring-1 ring-slate-200/70">
            <FaFilePdf />
          </span>

          <div className="min-w-0">
            <p className="text-sm font-bold text-navy">Constancia AFIP / DGR</p>
            <p className="text-xs text-slate-500">
              {disponible
                ? "Documento respaldatorio cargado al registrarse"
                : url
                ? "Archivo de origen desconocido"
                : "Sin constancia cargada"}
            </p>
          </div>
        </div>

        {disponible && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-primary/40 hover:bg-surface-blue"
            >
              {visible ? <FaEyeSlash className="text-[11px]" /> : <FaEye className="text-[11px]" />}
              {visible ? "Ocultar visor" : "Ver aquí"}
            </button>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-primary-dark"
            >
              Abrir PDF <FaArrowUpRightFromSquare className="text-[10px]" />
            </a>
          </div>
        )}
      </div>

      {disponible && visible && (
        <div className="h-80 border-t border-slate-200/80 bg-white sm:h-96">
          <VisorConstancia url={url} razonSocial={razonSocial} />
        </div>
      )}
    </div>
  );
}
