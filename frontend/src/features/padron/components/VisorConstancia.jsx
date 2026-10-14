/** Muestra la constancia (PDF o imagen) solo si viene de Cloudinary. */
export default function VisorConstancia({ url = "", razonSocial }) {
  if (!url) {
    return (
      <div className="text-center text-gray-400">
        <span className="text-4xl block mb-2">⚠️</span>
        <p className="font-bold">No se adjuntó constancia.</p>
      </div>
    );
  }

  if (!url.includes("res.cloudinary.com")) {
    return (
      <div className="text-center text-red-400">
        <span className="text-4xl block mb-2">🛑</span>
        <p className="font-bold">Archivo bloqueado o de origen desconocido.</p>
      </div>
    );
  }

  if (url.toLowerCase().endsWith(".pdf")) {
    return (
      <iframe
        src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
        title="Visor de Constancia"
        className="w-full h-full border-none"
      />
    );
  }

  return (
    <img
      src={url}
      alt={`Constancia de ${razonSocial}`}
      className="w-full h-full object-contain bg-[#e5e7eb]"
    />
  );
}
