import Logo from "../assets/img/logo.png"

export default function Card({ titulo, subtitulo, imagenUrl, fecha, onLeerMas }) {
  const obtenerImagenSrc = () => {
    if (!imagenUrl) return null;
    if (imagenUrl.startsWith("http://") || imagenUrl.startsWith("https://res.cloudinary.com/")) {
      return imagenUrl;
    }
    return `${import.meta.env.VITE_API_URL_UPLOADS}/${imagenUrl}`;
  };
 return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 flex flex-col h-full">

      {/* IMAGEN DE LA TARJETA */}
      {imagenUrl ? (
        <img
          src={obtenerImagenSrc()}
          alt={titulo}
          className="w-full h-48 object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-tr from-[#132A46] to-[#1D7BB6] flex items-center justify-center p-6 flex-shrink-0">
          <img src={Logo} alt="CAPYMEF" className="h-24 w-auto object-contain opacity-30" />
        </div>
      )}

      <div className="p-6 flex flex-col flex-grow">
        {/* FECHA */}
        <div className="text-xs font-semibold text-[#1D7BB6] uppercase tracking-wider mb-2">
          {fecha ? new Date(fecha).toLocaleDateString('es-AR') : ""}
        </div>

        {/* TÍTULO */}
        <h3 className="text-xl font-bold text-[#132A46] mb-2 line-clamp-2">
          {titulo}
        </h3>

        {/* SUBTÍTULO */}
        <div className="mb-4 flex-grow">
          {subtitulo ? (
            <p className="text-gray-600 line-clamp-3 text-sm">
              {subtitulo}
            </p>
          ) : (
            <p className="text-transparent text-sm select-none" aria-hidden="true">
              &nbsp;
            </p>
          )}
        </div>

        {/* BOTÓN */}
        <div className="pt-2 mt-auto">
          <button onClick={onLeerMas}
            className="text-[#1D7BB6] font-semibold hover:text-[#132A46] transition-colors text-sm">
            Leer más
          </button>
        </div>
      </div>

    </div>
  );
}