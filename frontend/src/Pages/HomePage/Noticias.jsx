import { useEffect, useState } from "react";
import { noticiasIniciales } from "../Home.jsx";
import { Footer, Navbar, NavbarPublico } from "../../Components/index.js";

export default function Noticias() {
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!noticiaSeleccionada) return undefined;

    const cerrarConEscape = (event) => {
      if (event.key === "Escape") setNoticiaSeleccionada(null);
    };

    document.addEventListener("keydown", cerrarConEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "";
    };
  }, [noticiaSeleccionada]);

  return (
    <>
      <header>{token ? <Navbar /> : <NavbarPublico />}</header>
      <main className="min-h-screen bg-white px-6 pb-20 pt-32 font-sans md:px-24">
        <div className="mb-12 flex flex-col items-center">
          <h1 className="text-3xl font-extrabold text-[#1A4B76] sm:text-4xl">
            Noticias
          </h1>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {noticiasIniciales.map((noticia) => (
            <article
              key={noticia.id}
              className="flex flex-col overflow-hidden rounded-2xl bg-white text-black shadow-xl transition-transform duration-300 hover:z-10 hover:scale-[1.03] hover:shadow-2xl"
            >
              <div className="h-56 overflow-hidden bg-gray-100">
                <img src={noticia.imagen} alt={noticia.titulo} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <span className="mb-3 text-xs font-bold uppercase tracking-wide text-[#1D7BB6]">
                  {noticia.categoria} · {noticia.fecha}
                </span>
                <h2 className="mb-3 text-xl font-bold leading-tight text-gray-900">{noticia.titulo}</h2>
                <p className="mb-6 flex-grow text-sm leading-relaxed text-gray-600">{noticia.resumen}</p>
                <button
                  type="button"
                  onClick={() => setNoticiaSeleccionada(noticia)}
                  className="mt-auto text-left text-sm font-bold text-[#1D7BB6] transition-colors hover:text-[#0f568b]"
                >
                  Leer más →
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      {noticiaSeleccionada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setNoticiaSeleccionada(null)}
        >
          <article
            className="relative max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 text-gray-800 shadow-2xl md:p-12"
            role="dialog"
            aria-modal="true"
            aria-labelledby="noticia-modal-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setNoticiaSeleccionada(null)}
              className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-2xl text-gray-700 hover:bg-gray-200"
              aria-label="Cerrar noticia"
            >
              ×
            </button>
            <h2 id="noticia-modal-titulo" className="pr-12 text-3xl font-bold leading-tight text-gray-900 md:text-5xl">
              {noticiaSeleccionada.titulo}
            </h2>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold uppercase tracking-wide text-[#1D7BB6]">
              <span>{noticiaSeleccionada.categoria}</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500">{noticiaSeleccionada.fecha}</span>
            </div>
            <img src={noticiaSeleccionada.imagen} alt={noticiaSeleccionada.titulo} className="mx-auto my-8 max-h-[420px] w-full rounded-lg object-contain" />
            <div
              className="noticia-contenido mx-auto max-w-4xl text-justify text-lg leading-relaxed text-gray-800"
              dangerouslySetInnerHTML={{ __html: noticiaSeleccionada.contenido_completo || `<p>${noticiaSeleccionada.resumen}</p>` }}
            />
          </article>
        </div>
      )}

      <footer className="bg-[#1b4f7a] pt-5">
        <Footer />
      </footer>
    </>
  );
}
