import { useEffect, useState } from "react";
import { Card, Modal } from "../../Components";
import { obtenerNoticiasPublicas } from "../../services/noticiasService";

export default function NoticiasSocio() {
    const [noticias, setNoticias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);

    useEffect(() => {
        const cargarNoticias = async () => {
            try {
                const resultado = await obtenerNoticiasPublicas();
                if (!resultado.exito) throw new Error(resultado.mensaje || "No se pudieron cargar las noticias");
                setNoticias(Array.isArray(resultado.data) ? resultado.data : []);
            } catch (errorCarga) {
                setError(errorCarga.message);
            } finally {
                setCargando(false);
            }
        };

        cargarNoticias();
    }, []);

    return (
        <section className="min-h-[calc(100vh-9rem)] bg-[#edf7fd] px-1 py-2 sm:px-3 sm:py-5">
            <div className="mx-auto max-w-7xl">
                <h1 className="mb-8 text-2xl font-normal uppercase text-[#073d6f] sm:text-[25px]">Noticias</h1>
                {error && <div className="mb-6 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                {cargando ? (
                    <p className="py-12 text-center text-sm text-gray-600">Cargando noticias...</p>
                ) : noticias.length === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-600">Todavía no hay noticias publicadas.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {noticias.map((noticia) => (
                            <Card
                                key={noticia.id}
                                titulo={noticia.titulo}
                                subtitulo={noticia.subtitulo}
                                imagenUrl={noticia.imagenUrl}
                                fecha={noticia.fechaPublicacion}
                                categoria={noticia.categoria}
                                onLeerMas={() => setNoticiaSeleccionada(noticia)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {noticiaSeleccionada && (
                <Modal noticia={noticiaSeleccionada} onClose={() => setNoticiaSeleccionada(null)} />
            )}
        </section>
    );
}
