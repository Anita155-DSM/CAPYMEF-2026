import { useEffect, useMemo, useState } from "react";
import NoticiaHomeCard from "@/features/landing/components/NoticiaHomeCard";
import NoticiaModal from "@/features/noticias/components/NoticiaModal";
import { obtenerNoticiasSocios } from "@/services/noticiasService";

const NOTICIAS_POR_PAGINA = 6; // igual que la página pública de noticias

const clasePagina = "rounded-lg bg-white px-4 py-2 text-sm font-bold text-sidebar shadow-sm transition-colors hover:bg-sidebar hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-sidebar";
const claseFiltro = (activo) =>
  `rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
    activo ? "bg-sidebar text-white shadow-sm" : "border border-gray-200 bg-white text-sidebar hover:bg-surface-blue"
  }`;

export default function NoticiasSocio() {
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [seleccionada, setSeleccionada] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState(null); // null = todas
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    let activo = true;
    (async () => {
      const resultado = await obtenerNoticiasSocios();
      if (!activo) return;
      if (resultado.exito) setNoticias(Array.isArray(resultado.data) ? resultado.data : []);
      else setError(resultado.mensaje || "No se pudieron cargar las noticias.");
      setCargando(false);
    })();
    return () => {
      activo = false;
    };
  }, []);

  // Las categorías salen de las noticias reales (nada escrito a mano). Si ninguna tiene categoría, no se muestra el filtro.
  const categorias = useMemo(() => {
    const cuenta = new Map();
    noticias.forEach((n) => n.categoria && cuenta.set(n.categoria, (cuenta.get(n.categoria) || 0) + 1));
    return [...cuenta.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [noticias]);

  const filtradas = categoriaActiva ? noticias.filter((n) => n.categoria === categoriaActiva) : noticias;
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / NOTICIAS_POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice((paginaSegura - 1) * NOTICIAS_POR_PAGINA, paginaSegura * NOTICIAS_POR_PAGINA);

  const elegirCategoria = (categoria) => {
    setCategoriaActiva(categoria);
    setPagina(1);
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1 text-sm font-semibold text-primary">NOVEDADES DE LA CÁMARA</p>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-navy sm:text-3xl">Noticias</h1>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {categorias.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
          <button type="button" onClick={() => elegirCategoria(null)} className={claseFiltro(categoriaActiva === null)}>
            Todas ({noticias.length})
          </button>
          {categorias.map(([categoria, cantidad]) => (
            <button key={categoria} type="button" onClick={() => elegirCategoria(categoria)} className={claseFiltro(categoriaActiva === categoria)}>
              {categoria} ({cantidad})
            </button>
          ))}
        </div>
      )}

      {cargando ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sidebar border-t-transparent" />
          <p className="text-sm text-gray-600">Buscando las últimas novedades...</p>
        </div>
      ) : filtradas.length === 0 ? (
        !error && (
          <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center shadow-sm">
            <p className="text-gray-600">
              {categoriaActiva ? "No hay noticias en esta categoría." : "Todavía no hay noticias publicadas."}
            </p>
          </div>
        )
      ) : (
        <>
          {/* Mismas tarjetas que la landing. Con el menú lateral, 3 columnas recién desde xl */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {visibles.map((noticia) => (
              <NoticiaHomeCard key={noticia.id} noticia={noticia} onClick={() => setSeleccionada(noticia)} />
            ))}
          </div>

          {totalPaginas > 1 && (
            <nav className="flex items-center justify-center gap-3 pt-4" aria-label="Paginación de noticias">
              <button type="button" onClick={() => setPagina(Math.max(1, paginaSegura - 1))} disabled={paginaSegura === 1} className={clasePagina}>
                Anterior
              </button>
              <span className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-sidebar shadow-sm">
                Página {paginaSegura} de {totalPaginas}
              </span>
              <button type="button" onClick={() => setPagina(Math.min(totalPaginas, paginaSegura + 1))} disabled={paginaSegura === totalPaginas} className={clasePagina}>
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}

      {seleccionada && <NoticiaModal noticia={seleccionada} onClose={() => setSeleccionada(null)} />}
    </div>
  );
}