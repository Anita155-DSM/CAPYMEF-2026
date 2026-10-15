import { useState } from "react";
import { Link } from "react-router-dom";
import NoticiaModal from "@/features/noticias/components/NoticiaModal";
import NoticiaHomeCard from "./NoticiaHomeCard";

function Contenido({ cargando, noticias, onSeleccionar }) {
  if (cargando) {
    return (
      <div className="text-center py-20">
        <div className="w-10 h-10 border-4 border-sidebar border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Buscando las últimas novedades...</p>
      </div>
    );
  }

  if (noticias.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 max-w-3xl mx-auto shadow-sm">
        <p className="text-gray-600 text-lg">Todavía no hay noticias publicadas.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
      {noticias.slice(0, 3).map((n) => (
        <NoticiaHomeCard key={n.id} noticia={n} onClick={() => onSeleccionar(n)} />
      ))}
    </div>
  );
}

export default function NovedadesSection({ noticias, cargando }) {
  const [seleccionada, setSeleccionada] = useState(null);

  return (
    <section id="novedades" className="w-full bg-surface px-6 sm:px-10 md:px-24 pt-20 pb-20 font-sans inicio-reveal">
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between mb-16 max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-navy-soft tracking-tight font-sans">
          Novedades de la Cámara
        </h2>
        <Link
          to="/noticias"
          className="mt-6 md:mt-0 self-start md:self-auto flex-shrink-0 bg-navy-soft text-white text-sm font-semibold rounded-full px-6 py-3 transition-colors hover:bg-sidebar shadow-md flex items-center gap-2"
        >
          Ver todas &rarr;
        </Link>
      </div>

      <Contenido cargando={cargando} noticias={noticias} onSeleccionar={setSeleccionada} />

      {seleccionada && <NoticiaModal noticia={seleccionada} onClose={() => setSeleccionada(null)} />}
    </section>
  );
}
