import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCalendarDay,
  FaEye,
  FaMagnifyingGlass,
  FaNewspaper,
  FaPenToSquare,
  FaPlus,
  FaTag,
} from "react-icons/fa6";
import logo from "@/assets/img/logo.png";
import { formatearFechaLarga } from "@/shared/utils/fechas";
import { urlImagen } from "@/shared/utils/imagenes";
import { obtenerTodasLasNoticiasAdmin } from "@/services/noticiasService";
import EditarNoticiaModal from "@/features/noticias/components/EditarNoticiaModal";
import NoticiaModal from "@/features/noticias/components/NoticiaModal";

const NOTICIAS_POR_PAGINA = 6;

const clasePagina =
  "cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-sidebar shadow-2xs transition-colors hover:bg-sidebar hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-sidebar";

const claseFiltro = (activo) =>
  `cursor-pointer rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
    activo
      ? "bg-sidebar text-white shadow-2xs"
      : "border border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:bg-surface-blue hover:text-navy"
  }`;

const ETIQUETA_VISIBILIDAD = {
  todos: "Web y Socios",
  publico: "Solo Público",
  socios: "Solo Socios",
};

export default function NoticiasAdmin() {
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroVisibilidad, setFiltroVisibilidad] = useState("todos");
  const [pagina, setPagina] = useState(1);

  // modalEditor: { modo: "crear" | "editar", noticia: objeto | null } | null
  const [modalEditor, setModalEditor] = useState(null);
  const [noticiaVistaPrevia, setNoticiaVistaPrevia] = useState(null);

  const cargarNoticias = useCallback(async () => {
    setCargando(true);
    setError("");
    const resultado = await obtenerTodasLasNoticiasAdmin();
    if (resultado.exito) {
      setNoticias(Array.isArray(resultado.data) ? resultado.data : []);
    } else {
      setError(resultado.mensaje || "No se pudieron cargar las noticias.");
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarNoticias();
  }, [cargarNoticias]);

  // Conteo de categorías presentes en las noticias reales (igual que en NoticiasSocioPage)
  const categorias = useMemo(() => {
    const cuenta = new Map();
    noticias.forEach(
      (n) => n.categoria && cuenta.set(n.categoria, (cuenta.get(n.categoria) || 0) + 1)
    );
    return [...cuenta.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [noticias]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return noticias.filter((n) => {
      if (categoriaActiva && n.categoria !== categoriaActiva) return false;
      if (filtroEstado !== "todos" && n.estado !== filtroEstado) return false;
      if (filtroVisibilidad !== "todos" && (n.visibilidad || "todos") !== filtroVisibilidad) {
        return false;
      }
      if (!q) return true;
      const titulo = (n.titulo || "").toLowerCase();
      const subtitulo = (n.subtitulo || "").toLowerCase();
      const contenido = (n.contenido || "").toLowerCase();
      return titulo.includes(q) || subtitulo.includes(q) || contenido.includes(q);
    });
  }, [noticias, busqueda, categoriaActiva, filtroEstado, filtroVisibilidad]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / NOTICIAS_POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice(
    (paginaSegura - 1) * NOTICIAS_POR_PAGINA,
    paginaSegura * NOTICIAS_POR_PAGINA
  );

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoriaActiva(null);
    setFiltroEstado("todos");
    setFiltroVisibilidad("todos");
    setPagina(1);
  };

  const hayFiltrosActivos =
    Boolean(busqueda.trim()) ||
    Boolean(categoriaActiva) ||
    filtroEstado !== "todos" ||
    filtroVisibilidad !== "todos";

  return (
    <div className="space-y-6">
      {/* Encabezado institucional unificado con Socio */}
      <header className="relative overflow-hidden rounded-none border border-primary/15 bg-linear-to-r from-white via-white to-surface-blue p-5 shadow-xs sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/6"
        />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Comunicación Institucional
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
              Noticias y comunicados
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
              Publicá comunicados, filtrá las novedades activas o en borrador y gestioná su visibilidad en la web y en el panel de socios.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalEditor({ modo: "crear", noticia: null })}
            className="inline-flex w-fit shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-dark sm:text-sm"
          >
            <FaPlus /> Nueva noticia
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-none border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Barra de búsqueda y filtros sobre el fondo celeste (sin contenedor blanco detrás de las tarjetas) */}
      {!cargando && noticias.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Buscador */}
            <div className="relative w-full lg:max-w-md">
              <FaMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por título, subtítulo o contenido..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs sm:text-sm text-navy shadow-2xs outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Selectores de Estado y Visibilidad */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setPagina(1);
                }}
                aria-label="Filtrar por estado"
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-primary focus:outline-none sm:text-sm"
              >
                <option value="todos">Estado: Todos</option>
                <option value="publicado">Publicadas (Visibles)</option>
                <option value="borrador">Borradores (Ocultas)</option>
              </select>

              <select
                value={filtroVisibilidad}
                onChange={(e) => {
                  setFiltroVisibilidad(e.target.value);
                  setPagina(1);
                }}
                aria-label="Filtrar por visibilidad"
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-primary focus:outline-none sm:text-sm"
              >
                <option value="todos">Visibilidad: Todas</option>
                <option value="publico">Solo Público</option>
                <option value="socios">Solo Socios</option>
              </select>

              {hayFiltrosActivos && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="cursor-pointer px-2 py-1.5 text-xs font-semibold text-primary hover:text-navy hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {/* Pastillas de categorías idénticas a NoticiasSocioPage */}
          {categorias.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
              <button
                type="button"
                onClick={() => {
                  setCategoriaActiva(null);
                  setPagina(1);
                }}
                className={claseFiltro(categoriaActiva === null)}
              >
                Todas ({noticias.length})
              </button>
              {categorias.map(([categoria, cantidad]) => (
                <button
                  key={categoria}
                  type="button"
                  onClick={() => {
                    setCategoriaActiva(categoria);
                    setPagina(1);
                  }}
                  className={claseFiltro(categoriaActiva === categoria)}
                >
                  {categoria} ({cantidad})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Estado de carga o listado de tarjetas directamente sobre el fondo celeste */}
      {cargando ? (
        <div className="rounded-none border border-slate-200/90 bg-white py-16 text-center shadow-xs">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sidebar border-t-transparent" />
          <p className="text-sm text-slate-600">Buscando las últimas novedades...</p>
        </div>
      ) : filtradas.length === 0 ? (
        !error && (
          <div className="rounded-none border border-slate-200/90 bg-white py-16 text-center shadow-xs">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-surface-blue text-2xl text-primary">
              <FaNewspaper />
            </span>
            <p className="font-semibold text-navy">
              {hayFiltrosActivos
                ? "No se encontraron noticias con los filtros aplicados"
                : "Todavía no hay noticias publicadas"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {hayFiltrosActivos
                ? "Probá cambiando los filtros o el texto de búsqueda."
                : 'Usá el botón "Nueva noticia" para crear el primer comunicado.'}
            </p>
          </div>
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
            {visibles.map((noticia) => {
              const imagen = urlImagen(noticia.imagenUrl);
              const esPublicado = noticia.estado === "publicado";
              const etiquetaVis =
                ETIQUETA_VISIBILIDAD[noticia.visibilidad] || "Web y Socios";

              return (
                <article
                  key={noticia.id}
                  onClick={() => setModalEditor({ modo: "editar", noticia })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setModalEditor({ modo: "editar", noticia });
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Editar noticia: ${noticia.titulo}`}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-none border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar"
                >
                  {/* Cabecera con imagen o degradado institucional con logo (idéntica a NoticiaHomeCard) */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    {imagen ? (
                      <img
                        src={imagen}
                        alt={noticia.titulo}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-navy to-primary p-6">
                        <img
                          src={logo}
                          alt="CAPYMEF"
                          className="max-h-20 max-w-[55%] object-contain opacity-80 drop-shadow-md"
                        />
                      </div>
                    )}

                    {/* Categoría flotante a la izquierda */}
                    {noticia.categoria && (
                      <div className="absolute left-3 top-3 z-10">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-navy shadow-sm backdrop-blur-xs">
                          <FaTag className="text-[11px] text-primary" />
                          {noticia.categoria}
                        </span>
                      </div>
                    )}

                    {/* Estado flotante a la derecha */}
                    <div className="absolute right-3 top-3 z-10">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                          esPublicado
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        {esPublicado ? "Visible" : "Borrador"}
                      </span>
                    </div>
                  </div>

                  {/* Contenido descriptivo idéntico a NoticiaHomeCard */}
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                      <span className="flex items-center gap-2">
                        <FaCalendarDay />
                        <span>{formatearFechaLarga(noticia.fechaPublicacion)}</span>
                      </span>
                      <span className="rounded-md bg-surface-blue px-2 py-0.5 text-[10px] font-bold text-navy">
                        {etiquetaVis}
                      </span>
                    </div>

                    <h3 className="line-clamp-2 text-lg font-bold leading-snug text-navy transition-colors group-hover:text-primary">
                      {noticia.titulo}
                    </h3>

                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">
                      {noticia.subtitulo ||
                        noticia.resumen ||
                        noticia.contenido ||
                        "Sin descripción disponible."}
                    </p>

                    {/* Acciones al pie de la tarjeta */}
                    <div
                      className="mt-5 flex items-center justify-between gap-2 border-t border-gray-100 pt-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setNoticiaVistaPrevia(noticia)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary/25 bg-surface-blue px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                        title="Ver cómo se muestra la noticia al socio"
                      >
                        <FaEye className="text-[11px]" /> Vista previa
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalEditor({ modo: "editar", noticia })}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-primary-dark"
                      >
                        <FaPenToSquare className="text-[11px]" /> Editar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
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

      {/* Modal unificado de creación / edición */}
      {modalEditor && (
        <EditarNoticiaModal
          key={modalEditor.noticia?.id || "nueva-noticia"}
          noticia={modalEditor.noticia}
          onClose={() => setModalEditor(null)}
          onNoticiaActualizada={cargarNoticias}
          onVistaPrevia={(n) => setNoticiaVistaPrevia(n)}
        />
      )}

      {/* Modal de vista previa idéntico al que ve el socio */}
      {noticiaVistaPrevia && (
        <NoticiaModal
          noticia={noticiaVistaPrevia}
          onClose={() => setNoticiaVistaPrevia(null)}
        />
      )}
    </div>
  );
}
