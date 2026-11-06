import Logo from "../assets/img/logo.png"
import { FaCalendarDays, FaChevronRight, FaShareNodes } from "react-icons/fa6";

export default function Card({ titulo, subtitulo, imagenUrl, fecha, categoria, onLeerMas, className = "", estiloNoticias = false }) {
  const obtenerImagenSrc = () => {
    if (!imagenUrl) return null;
    if (imagenUrl.startsWith("https://") || imagenUrl.startsWith("https://res.cloudinary.com/")) {
      return imagenUrl;
    }
    return `${import.meta.env.VITE_API_URL_UPLOADS}/${imagenUrl}`;
  };
 return (
    <article className={`${className} bg-white ${estiloNoticias ? "rounded-md shadow-md hover:-translate-y-1 hover:shadow-xl" : "rounded-xl shadow-md hover:-translate-y-2 hover:shadow-2xl"} overflow-hidden transition-all duration-300 border border-gray-200 flex flex-col h-full group`}>

      {/* IMAGEN DE LA TARJETA */}
      <div className="relative h-48 w-full overflow-hidden bg-[#132A46] shrink-0">
        {imagenUrl ? (
          <img
            src={obtenerImagenSrc()}
            alt={titulo}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#132A46] to-[#1D7BB6] flex items-center justify-center p-6">
            <img src={Logo} alt="CAPYMEF" className="max-h-20 max-w-[70%] object-contain opacity-80 drop-shadow-md" />
          </div>
        )}
        {estiloNoticias && (
          <span className="absolute top-3 right-3 bg-white/95 px-2.5 py-1 rounded-full text-[11px] font-bold text-[#1D7BB6] flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D7BB6]" aria-hidden="true"></span>
            {categoria || "Institucional"}
          </span>
        )}
      </div>

      <div className={`${estiloNoticias ? "p-5" : "p-6"} flex flex-col flex-grow`}>
        {/* FECHA */}
        <div className="text-[11px] font-semibold text-[#132A46] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          {estiloNoticias && <FaCalendarDays className="text-[#1D7BB6]" aria-hidden="true" />}
          <span>{fecha ? new Date(fecha).toLocaleDateString('es-AR') : ""}</span>
          {!estiloNoticias && <><span className="w-1 h-1 rounded-full bg-[#1D7BB6]" aria-hidden="true"></span><span>{categoria || "Institucional"}</span></>}
        </div>

        {/* TÍTULO */}
        <h3 className={`${estiloNoticias ? "text-lg my-3" : "text-xl my-5"} font-bold text-[#132A46] leading-snug line-clamp-2 group-hover:text-[#1D7BB6] transition-colors`}>
          {titulo}
        </h3>

        {/* SUBTÍTULO */}
        <div className="my-4 grow">
          {subtitulo ? (
            <p className={`${estiloNoticias ? "text-sm" : "text-md"} text-gray-600 line-clamp-3 leading-relaxed`}>
              {subtitulo}
            </p>
          ) : (
            <p className="text-transparent text-sm select-none" aria-hidden="true">
              &nbsp;
            </p>
          )}
        </div>

        {/* BOTÓN */}
        <div className="pt-4 mt-auto border-t border-gray-200 flex items-center justify-between">
          <button onClick={onLeerMas}
            className="inline-flex items-center gap-1 text-[#1D7BB6] font-semibold hover:text-[#132A46] transition-colors text-sm">
            Leer más <FaChevronRight className="text-[10px]" aria-hidden="true" />
          </button>
          {estiloNoticias && <FaShareNodes className="text-gray-400 text-sm" aria-hidden="true" />}
        </div>
      </div>

    </article>
  );
}