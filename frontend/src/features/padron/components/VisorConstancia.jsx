import { FaFileCircleExclamation, FaShieldHalved } from "react-icons/fa6";

/** Muestra la constancia (PDF o imagen) solo si viene de Cloudinary. */
export default function VisorConstancia({ url = "", razonSocial }) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
          <FaFileCircleExclamation />
        </span>
        <p className="text-sm font-semibold text-navy">No se adjuntó constancia fiscal</p>
        <p className="mt-1 text-xs text-slate-500">
          El solicitante no cargó un documento PDF o imagen al momento del registro.
        </p>
      </div>
    );
  }

  if (!url.includes("res.cloudinary.com")) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-red-500">
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-2xl text-red-500">
          <FaShieldHalved />
        </span>
        <p className="text-sm font-semibold text-red-700">
          Archivo bloqueado o de origen desconocido
        </p>
        <p className="mt-1 text-xs text-red-500">
          Por seguridad solo se previsualizan documentos alojados en el servidor institucional.
        </p>
      </div>
    );
  }

  if (url.toLowerCase().endsWith(".pdf")) {
    return (
      <iframe
        src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
        title={`Constancia de ${razonSocial}`}
        className="h-full w-full border-none bg-white"
      />
    );
  }

  return (
    <img
      src={url}
      alt={`Constancia de ${razonSocial}`}
      className="h-full w-full bg-slate-100 object-contain"
    />
  );
}
