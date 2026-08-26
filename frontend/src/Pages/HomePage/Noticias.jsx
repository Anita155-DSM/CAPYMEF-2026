import { useEffect, useState } from "react";
import { Card, Modal, Navbar } from "../../Components";
import { obtenerNoticiasPublicas } from "../../services/noticiasService";

export default function NoticiasPublicas() {
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);

  // 2. ESTADO PARA CONTROLAR EL MODAL
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);

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

  if (cargando) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <p className="text-xl font-bold text-[#1D7BB6]">Cargando noticias...</p>
      </div>
    );
  }

  return (<>

    <Navbar />
    <div className="bg-gray-50 min-h-screen py-12 mt-8 px-4 sm:px-6 lg:px-8 font-sans animacion-modal">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-[#132A46] sm:text-5xl">
            Últimas Noticias
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Mantenete informado con las novedades de CAPYMEF.
          </p>
        </div>

        {noticias.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p>Todavía no hay noticias publicadas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {noticias.map((noticia) => (
              <Card
                key={noticia.id}
                titulo={noticia.titulo}
                subtitulo={noticia.subtitulo}
                imagenUrl={noticia.imagenUrl}
                fecha={noticia.fechaPublicacion}
                // 3. LE PASAMOS TODA LA NOTICIA AL ESTADO AL HACER CLIC
                onLeerMas={() => setNoticiaSeleccionada(noticia)}
              />
            ))}
          </div>
        )}

      </div>

      {/* 4. RENDERIZAMOS EL MODAL SOLO SI HAY UNA NOTICIA SELECCIONADA */}
      {noticiaSeleccionada && (
        <Modal
          noticia={noticiaSeleccionada}
          onClose={() => setNoticiaSeleccionada(null)}
        />
      )}

    </div>
  </>
  );
}