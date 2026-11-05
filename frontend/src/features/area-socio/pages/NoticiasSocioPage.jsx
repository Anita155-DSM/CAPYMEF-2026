import { useEffect, useMemo, useState } from "react";
import { FaNewspaper } from "react-icons/fa6";
import NoticiaHomeCard from "@/features/landing/components/NoticiaHomeCard";
import NoticiaModal from "@/features/noticias/components/NoticiaModal";
import { obtenerNoticiasSocios } from "@/services/noticiasService";

const NOTICIAS_POR_PAGINA = 6;

const clasePagina =
  "rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-sidebar shadow-2xs transition-colors hover:bg-sidebar hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-sidebar";

const claseFiltro = (activo) =>
  `cursor-pointer rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
    activo
      ? "bg-sidebar text-white shadow-2xs"
      : "border border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:bg-surface-blue hover:text-navy"
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

  const categorias = useMemo(() => {
    const cuenta = new Map();
    noticias.forEach((n) => n.categoria && cuenta.set(n.categoria, (cuenta.get(n.categoria) || 0) + 1));
    return [...cuenta.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [noticias]);

  const filtradas = categoriaActiva
    ? noticias.filter((n) => n.categoria === categoriaActiva)
    : noticias;
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / NOTICIAS_POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice(
    (paginaSegura - 1) * NOTICIAS_POR_PAGINA,
    paginaSegura * NOTICIAS_POR_PAGINA
  );

  const elegirCategoria = (categoria) => {
    setCategoriaActiva(categoria);
    setPagina(1);
  };

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-none border border-primary/15 bg-linear-to-r from-white via-white to-surface-blue p-5 shadow-xs sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/6"
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Novedades de la Cámara
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
            Noticias y comunicados
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
            Mantenete al tanto de las gestiones, comunicados institucionales y novedades para socios de CAPYMEF.
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {categorias.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
          <button
            type="button"
            onClick={() => elegirCategoria(null)}
            className={claseFiltro(categoriaActiva === null)}
          >
            Todas ({noticias.length})
          </button>
          {categorias.map(([categoria, cantidad]) => (
            <button
              key={categoria}
              type="button"
              onClick={() => elegirCategoria(categoria)}
              className={claseFiltro(categoriaActiva === categoria)}
            >
              {categoria} ({cantidad})
            </button>
          ))}
        </div>
      )}

      {cargando ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white py-16 text-center shadow-xs">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sidebar border-t-transparent" />
          <p className="text-sm text-slate-600">Buscando las últimas novedades...</p>
        </div>
      ) : filtradas.length === 0 ? (
        !error && (
          <div className="rounded-2xl border border-slate-200/90 bg-white py-16 text-center shadow-xs">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-surface-blue text-2xl text-primary">
              <FaNewspaper />
            </span>
            <p className="font-semibold text-navy">
              {categoriaActiva
                ? "No hay noticias en esta categoría"
                : "Todavía no hay noticias publicadas"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Pronto compartiremos nuevos comunicados y novedades institucionales.
            </p>
          </div>
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
            {visibles.map((noticia) => (
              <NoticiaHomeCard
                key={noticia.id}
                noticia={noticia}
                onClick={() => setSeleccionada(noticia)}
              />
            ))}
          </div>

          {totalPaginas > 1 && (
            <nav
              className="flex items-center justify-center gap-3 pt-4"
              aria-label="Paginación de noticias"
            >
              <button
                type="button"
                onClick={() => setPagina(Math.max(1, paginaSegura - 1))}
                disabled={paginaSegura === 1}
                className={clasePagina}
              >
                Anterior
              </button>
              <span className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-sidebar shadow-2xs sm:text-sm">
                Página {paginaSegura} de {totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPagina(Math.min(totalPaginas, paginaSegura + 1))}
                disabled={paginaSegura === totalPaginas}
                className={clasePagina}
              >
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}

      {seleccionada && (
        <NoticiaModal noticia={seleccionada} onClose={() => setSeleccionada(null)} />
      )}
    </div>
  );
}
