import { formatearFecha } from "@/shared/utils/fechas";

const IconoCalendario = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default function NoticiaHomeCard({ noticia, onClick }) {
  return (
    <article
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden flex flex-col shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer group"
    >
      <div className="h-56 relative overflow-hidden bg-gray-100">
        <span className="absolute top-4 left-4 bg-surface text-sidebar text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-sm uppercase tracking-wide flex items-center gap-1.5">
          <IconoCalendario className="w-3.5 h-3.5" />
          {noticia.categoria || "Institucional"}
        </span>
        <img
          src={noticia.imagenUrl || "https://via.placeholder.com/600x400?text=Sin+Imagen"}
          alt={noticia.titulo}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-6 md:p-8 flex flex-col flex-1 bg-white">
        <div className="flex items-center gap-2 mb-3 text-sidebar">
          <IconoCalendario className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            {formatearFecha(noticia.fechaPublicacion)}
          </span>
        </div>

        <h3 className="text-lg font-bold mb-4 leading-snug text-navy-soft group-hover:text-sidebar transition-colors line-clamp-2">
          {noticia.titulo}
        </h3>

        <p className="text-gray-500 text-sm mb-6 flex-grow leading-relaxed line-clamp-3">
          {noticia.subtitulo || noticia.resumen}
        </p>

        <div className="mt-auto flex items-center text-sidebar font-bold text-sm bg-surface w-max px-4 py-2 rounded-lg transition-colors group-hover:bg-sidebar group-hover:text-white">
          Leer más <span className="ml-2 transform transition-transform group-hover:translate-x-1">&rarr;</span>
        </div>
      </div>
    </article>
  );
}
