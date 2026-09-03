import Logo from "../assets/img/logo.png"

export default function Card({ titulo, subtitulo, imagenUrl, fecha, categoria, onLeerMas }) {
  const obtenerImagenSrc = () => {
    if (!imagenUrl) return null;
    if (imagenUrl.startsWith("https://") || imagenUrl.startsWith("https://res.cloudinary.com/")) {
      return imagenUrl;
    }
    return `${import.meta.env.VITE_API_URL_UPLOADS}/${imagenUrl}`;
  };
 return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border border-gray-200 flex flex-col h-full">

      {/* IMAGEN DE LA TARJETA */}
      {imagenUrl ? (
        <img
          src={obtenerImagenSrc()}
          alt={titulo}
          className="w-full h-48 object-cover shrink-0"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-tr from-[#132A46] to-[#1D7BB6] flex items-center justify-center p-6 flex-shrink-0">
          <img src={Logo} alt="CAPYMEF" className="h-24 w-auto object-contain opacity-30" />
        </div>
      )}

      <div className="p-6 flex flex-col flex-grow">
        {/* FECHA */}
        <div className="text-xs font-semibold text-[#1D7BB6] uppercase tracking-wider mb-2 flex items-center gap-2">
          {fecha ? new Date(fecha).toLocaleDateString('es-AR') : ""}
          <span className="w-1 h-1 rounded-full bg-[#1D7BB6]" aria-hidden="true"></span>
          <span>{categoria || "Institucional"}</span>
        </div>

        {/* TÍTULO */}
        <h3 className="text-xl font-bold text-[#132A46] my-5 line-clamp-2">
          {titulo}
        </h3>

        {/* SUBTÍTULO */}
        <div className="my-4 grow">
          {subtitulo ? (
            <p className="text-gray-600 line-clamp-3 text-md">
              {subtitulo}
            </p>
          ) : (
            <p className="text-transparent text-sm select-none" aria-hidden="true">
              &nbsp;
            </p>
          )}
        </div>

        {/* BOTÓN */}
        <div className="pt-10 mt-auto">
          <button onClick={onLeerMas}
            className="text-[#1D7BB6] font-semibold hover:text-[#132A46] transition-colors text-sm">
            Leer más
          </button>
        </div>
      </div>

    </div>
  );
}