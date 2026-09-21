import { useEffect, useState } from "react";
import { Card, Footer, Modal, Navbar, NavbarPublico } from "../../Components";
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
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <p className="text-xl font-bold text-[#1D7BB6]">Cargando noticias...</p>
      </div>
    );
  }

  return (<>

    {estaLogueado ? <Navbar /> : <NavbarPublico />}
    <main className="bg-[#F8F9FF] min-h-screen pt-20 font-sans animacion-modal">
      <section className="w-full bg-[#EFF4FF] py-14 md:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 noticia-reveal">
          <div className="flex flex-col gap-2 max-w-3xl">
            <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#1D7BB6]">
              <span className="w-2 h-2 rounded-full bg-[#1D7BB6]" aria-hidden="true"></span>
              Actualidad y comunicados
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#132A46] sm:text-5xl">
              Últimas noticias
            </h1>
            <p className="mt-2 text-lg text-gray-600 md:text-xl">
              Mantenete informado con las novedades, actividades y comunicados de CAPYMEF.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-12 md:py-16">
        <div className="flex items-center justify-between gap-4 mb-8 noticia-reveal">
          <h2 className="flex items-center gap-3 text-xl font-bold text-[#132A46] sm:text-2xl">
            <span className="w-1.5 h-7 rounded-full bg-[#1D7BB6]" aria-hidden="true"></span>
            Novedades e informes
          </h2>
        </div>

        {noticias.length === 0 ? (
          <div className="text-center text-gray-500 py-10 noticia-reveal">
            <p>Todavía no hay noticias publicadas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {noticias.map((noticia, index) => (
              <Card
                key={noticia.id}
                titulo={noticia.titulo}
                subtitulo={noticia.subtitulo}
                imagenUrl={noticia.imagenUrl}
                fecha={noticia.fechaPublicacion}
                categoria={noticia.categoria}
                estiloNoticias
                className={`noticia-reveal noticia-reveal-delay-${(index % 3) + 1}`}
                // 3. LE PASAMOS TODA LA NOTICIA AL ESTADO AL HACER CLIC
                onLeerMas={() => setNoticiaSeleccionada(noticia)}
              />
            ))}
          </div>
        )}

      {/* 4. RENDERIZAMOS EL MODAL SOLO SI HAY UNA NOTICIA SELECCIONADA */}
      {noticiaSeleccionada && (
        <Modal
          noticia={noticiaSeleccionada}
          onClose={() => setNoticiaSeleccionada(null)}
        />
      )}

      </section>
    </main>

    <Footer />
  </>
  );
}