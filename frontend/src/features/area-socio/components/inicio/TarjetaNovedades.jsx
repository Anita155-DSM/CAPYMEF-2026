import { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaNewspaper } from "react-icons/fa6";
import dayjs from "@/shared/utils/fechas";
import NoticiaModal from "@/features/noticias/components/NoticiaModal";

/**
 * Últimas noticias para socios.
 *   estado: { cargando, error, lista } (viene de useNovedadesInicio)
 */
export default function TarjetaNovedades({ estado }) {
  const { cargando, error, lista } = estado;
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);

  let contenido;
  if (cargando) {
    contenido = (
      <div className="rounded-xl bg-surface p-5 text-sm text-slate-500">
        Cargando noticias...
      </div>
    );
  } else if (error) {
    contenido = (
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </p>
    );
  } else if (!lista.length) {
    contenido = (
      <div className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-surface p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg text-primary/70 shadow-2xs">
          <FaNewspaper />
        </span>
        <div>
          <p className="text-sm font-semibold text-navy">Sin novedades recientes</p>
          <p className="mt-0.5 text-xs text-slate-500">
            No hay noticias publicadas por el momento.
          </p>
        </div>
      </div>
    );
  } else {
    contenido = (
      <div className="divide-y divide-slate-100">
        {lista.map((noticia) => (
          <button
            key={noticia.id}
            type="button"
            onClick={() => setNoticiaSeleccionada(noticia)}
            className="group block w-full cursor-pointer rounded-lg py-3 text-left transition-colors first:pt-0 last:pb-0 hover:bg-surface/60"
          >
            <div className="flex items-center gap-2">
              {noticia.fechaPublicacion && dayjs(noticia.fechaPublicacion).isValid() && (
                <span className="rounded-md bg-surface-blue px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {dayjs(noticia.fechaPublicacion).format("DD/MM/YYYY")}
                </span>
              )}
              {noticia.categoria && (
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  {noticia.categoria}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm font-semibold leading-snug text-navy transition-colors group-hover:text-primary">
              {noticia.titulo}
            </p>
            {noticia.subtitulo && (
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                {noticia.subtitulo}
              </p>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <section className="flex h-full w-full flex-col rounded-none border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
            <FaNewspaper />
          </span>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy">
            Novedades
          </h2>
        </div>
        <Link
          to="/socios/noticias"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary-dark hover:underline sm:text-sm"
        >
          Ver todas <FaArrowRight className="text-xs" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-center">{contenido}</div>

      {noticiaSeleccionada && (
        <NoticiaModal
          noticia={noticiaSeleccionada}
          onClose={() => setNoticiaSeleccionada(null)}
        />
      )}
    </section>
  );
}
