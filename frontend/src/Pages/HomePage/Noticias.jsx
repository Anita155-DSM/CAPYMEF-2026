import { useEffect, useState } from "react";
import { Footer, Modal, Navbar, NavbarPublico } from "../../Components";
import { obtenerNoticiasPublicas } from "../../services/noticiasService";

export default function NoticiasPublicas() {
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);

  const token = localStorage.getItem("token");
  const estaLogueado = !!token;

  useEffect(() => {
    const cargarNoticias = async () => {
      try {
        const result = await obtenerNoticiasPublicas();
        if (result.exito) {
          setNoticias(result.data);
        }
      } catch (error) {
        console.error("Error cargando la vista de noticias:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarNoticias();
  }, []);

  // Animaciones de scroll
  useEffect(() => {
    if (cargando) return undefined;

    const elementos = document.querySelectorAll(".noticia-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    elementos.forEach((elemento) => observer.observe(elemento));

    return () => observer.disconnect();
  }, [cargando, noticias]);

  if (cargando) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#F4F8FB]">
        <div className="w-12 h-12 border-4 border-[#1b4f7a] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <header>
        {estaLogueado ? <Navbar /> : <NavbarPublico />}
      </header>

      <main className="bg-[#F4F8FB] min-h-screen pt-28 pb-16 px-6 sm:px-10 md:px-24 font-sans animacion-modal">
        <div className="max-w-7xl mx-auto">
          
          {/* HEADER DE LA SECCIÓN DE NOTICIAS */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 noticia-reveal">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-[2px] bg-[#1E8C93]"></div>
                <span className="text-[#1E8C93] font-bold tracking-widest text-xs uppercase">
                  Publicaciones
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#153448] tracking-tight font-sans">
                Todas las noticias
              </h1>
            </div>
          </div>

          {/* LISTADO DE TARJETAS (Idéntico a las del Home) */}
          {noticias.length === 0 ? (
            <div className="text-center text-gray-500 py-20 bg-white rounded-2xl shadow-sm border border-gray-200 noticia-reveal max-w-3xl mx-auto">
              <p className="text-lg">Todavía no hay noticias publicadas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {noticias.map((noticia, index) => (
                <article
                  key={noticia.id}
                  onClick={() => setNoticiaSeleccionada(noticia)}
                  className={`noticia-reveal noticia-reveal-delay-${(index % 3) + 1} bg-white rounded-2xl overflow-hidden flex flex-col shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer group`}
                >
                  {/* Imagen y Etiqueta */}
                  <div className="h-56 relative overflow-hidden bg-gray-100">
                    <span className="absolute top-4 left-4 bg-[#F4F8FB] text-[#1b4f7a] text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-sm uppercase tracking-wide flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      {noticia.categoria || 'Novedades'}
                    </span>
                    <img
                      src={noticia.imagenUrl || 'https://via.placeholder.com/600x400?text=Sin+Imagen'}
                      alt={noticia.titulo}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  
                  {/* Cuerpo de la Tarjeta */}
                  <div className="p-6 md:p-8 flex flex-col flex-1 bg-white">
                    <div className="flex items-center gap-2 mb-3 text-[#1b4f7a]">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span className="text-[11px] font-semibold uppercase tracking-wider">
                        {noticia.fechaPublicacion}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold mb-4 leading-snug text-[#153448] group-hover:text-[#1b4f7a] transition-colors line-clamp-2">
                      {noticia.titulo}
                    </h3>
                    
                    <p className="text-gray-500 text-sm mb-6 flex-grow leading-relaxed line-clamp-3">
                      {noticia.subtitulo || noticia.resumen}
                    </p>
                    
                    {/* Botón sutil con "Leer más" */}
                    <div className="mt-auto flex items-center text-[#1b4f7a] font-bold text-sm bg-[#F4F8FB] w-max px-4 py-2 rounded-lg transition-colors group-hover:bg-[#1b4f7a] group-hover:text-white">
                      Leer más <span className="ml-2 transform transition-transform group-hover:translate-x-1">&rarr;</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* RENDERIZAMOS EL MODAL */}
      {noticiaSeleccionada && (
        <Modal
          noticia={noticiaSeleccionada}
          onClose={() => setNoticiaSeleccionada(null)}
        />
      )}

      <Footer />
    </>
  );
}