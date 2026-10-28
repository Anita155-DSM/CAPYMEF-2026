import { useState } from "react";
import { FaExternalLinkAlt, FaEye, FaEyeSlash, FaFilePdf } from "react-icons/fa";
import { esConstanciaSegura } from "@/features/area-socio/utils/empresa";
import VisorConstancia from "./VisorConstancia";

/**
 * Constancia AFIP/DGR que el socio adjuntó al registrarse.
 * Se puede ver siempre, sin importar si el socio está aprobado, rechazado o inactivo.
 * El visor queda plegado hasta que el admin toca "Ver constancia".
 */
export default function ConstanciaSocio({ url, razonSocial }) {
  const [visible, setVisible] = useState(false);
  const disponible = esConstanciaSegura(url);

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg text-[#c0392b] shadow-sm">
          <FaFilePdf />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-navy">Constancia AFIP/DGR</p>
          <p className="text-xs text-gray-500">
            {disponible ? "Adjuntada al registrarse" : url ? "Archivo de origen desconocido" : "No hay constancia cargada"}
          </p>
        </div>

        {disponible && (
          <div className="flex w-full gap-2 sm:w-auto">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir en una pestaña nueva"
              aria-label="Abrir constancia en una pestaña nueva"
              className="inline-flex items-center justify-center rounded-lg border border-primary mr-10 px-3 py-2 text-sm text-primary transition-colors hover:bg-surface"
            >
              <FaExternalLinkAlt />
            </a>
          </div>
        )}
      </div>

      {disponible && visible && (
        <div className="h-[60vh] border-t border-gray-200 bg-gray-100">
          <VisorConstancia url={url} razonSocial={razonSocial} />
        </div>
      )}
    </div>
  );
}
