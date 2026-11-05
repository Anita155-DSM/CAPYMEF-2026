import { useMemo, useState } from "react";
import {
  FaFileExcel,
  FaPenToSquare,
  FaTriangleExclamation,
  FaUserGroup,
} from "react-icons/fa6";
import { toast } from "sonner";
import Paginacion from "@/shared/ui/Paginacion";
import BuscadorSocios from "../components/BuscadorSocios";
import TablaSocios from "../components/TablaSocios";
import EditarSocioModal from "../components/EditarSocioModal";
import { useBuscador } from "../hooks/useBuscador";
import { useUsuarios } from "../hooks/useUsuarios";
import { exportarPadronExcel } from "../utils/exportarPadron";

// Los "pendientes" viven en Solicitudes / Registros.
const noPendiente = (u) => u.estado !== "pendiente";

const SOCIOS_POR_PAGINA = 10;

const ESTILO_ESTADO = {
  aprobado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactivo: "bg-red-50 text-red-700 border-red-200",
  rechazado: "bg-slate-100 text-slate-600 border-slate-200",
};

const ESTILO_CATEGORIA = {
  activo: "bg-surface-blue text-primary border-primary/20",
  adherente: "bg-slate-100 text-slate-700 border-slate-200",
  padrino: "bg-amber-50 text-amber-800 border-amber-200",
};

const claseFiltroEstado = (activo) =>
  `cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
    activo
      ? "bg-sidebar text-white shadow-2xs"
      : "border border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:bg-surface-blue hover:text-navy"
  }`;

export default function PadronPage() {
  const { usuarios, cargando, recargar } = useUsuarios(noPendiente);
  const [socioAEditar, setSocioAEditar] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todos"); // "todos" | "aprobado" | "inactivo" | "mora"
  const [pagina, setPagina] = useState(1);

  const { filtros, dispatch, filtrados: filtradosBuscador, opciones } = useBuscador(usuarios);

  const filtrados = useMemo(() => {
    return filtradosBuscador.filter((s) => {
      if (filtroEstado === "aprobado") return s.estado === "aprobado";
      if (filtroEstado === "inactivo") return s.estado === "inactivo";
      if (filtroEstado === "mora") return Boolean(s.degradadoPorMora);
      return true;
    });
  }, [filtradosBuscador, filtroEstado]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / SOCIOS_POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = useMemo(
    () =>
      filtrados.slice(
        (paginaSegura - 1) * SOCIOS_POR_PAGINA,
        paginaSegura * SOCIOS_POR_PAGINA
      ),
    [filtrados, paginaSegura]
  );

  const conteos = useMemo(
    () => ({
      todos: usuarios.length,
      aprobados: usuarios.filter((u) => u.estado === "aprobado").length,
      inactivos: usuarios.filter((u) => u.estado === "inactivo").length,
      mora: usuarios.filter((u) => Boolean(u.degradadoPorMora)).length,
    }),
    [usuarios]
  );

  const exportar = async () => {
    if (filtrados.length === 0) {
      toast.error("No hay datos para exportar con los filtros actuales.");
      return;
    }
    await exportarPadronExcel(filtrados);
    toast.success("¡Archivo Excel descargado con éxito!");
  };

  const columnas = [
    {
      titulo: "Razón Social",
      className: "font-semibold text-navy",
      render: (s) => (
        <div>
          <p className="font-semibold text-navy">{s.razonSocial}</p>
          {s.degradadoPorMora && (
            <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
              <FaTriangleExclamation className="text-[10px]" /> Degradado por mora
            </span>
          )}
        </div>
      ),
    },
    { titulo: "CUIT", className: "tabular-nums text-slate-600", render: (s) => s.cuit },
    {
      titulo: "Contacto",
      render: (s) => (
        <div>
          <p className="text-slate-700">{s.email}</p>
          {s.telefono && <p className="text-xs tabular-nums text-slate-400">{s.telefono}</p>}
        </div>
      ),
    },
    {
      titulo: "Categoría",
      className: "",
      render: (s) => (
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
            ESTILO_CATEGORIA[s.categoria?.toLowerCase()] ||
            "border-slate-200 bg-slate-100 text-slate-700"
          }`}
        >
          {s.categoria || "Socio"}
        </span>
      ),
    },
    { titulo: "Rubro", render: (s) => s.rubro || "-" },
    { titulo: "Localidad", render: (s) => s.localidad || "-" },
    {
      titulo: "Estado",
      className: "",
      render: (s) => (
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
            ESTILO_ESTADO[s.estado] ?? "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {s.estado}
        </span>
      ),
    },
    {
      titulo: "Acciones",
      centrada: true,
      className: "",
      render: (s) => (
        <button
          type="button"
          onClick={() => setSocioAEditar(s)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-primary-dark"
          title="Editar datos del socio"
        >
          <FaPenToSquare className="text-[11px]" /> Editar
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado institucional idéntico a Noticias, Eventos y Registros */}
      <header className="relative overflow-hidden rounded-none border border-primary/15 bg-linear-to-r from-white via-white to-surface-blue p-5 shadow-xs sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/6"
        />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Nómina Institucional
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
              Padrón de socios
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
              Consultá, filtrá, editá la ficha institucional de las empresas asociadas y exportá el padrón actualizado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!cargando && (
              <span className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-3.5 py-2 text-xs font-semibold text-navy shadow-2xs sm:text-sm">
                <FaUserGroup className="text-primary" />
                Total:{" "}
                <strong className="font-bold text-primary tabular-nums">{filtrados.length}</strong>
              </span>
            )}

            <button
              type="button"
              onClick={exportar}
              disabled={cargando || filtrados.length === 0}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#107c41] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0c5e31] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              <FaFileExcel className="text-sm" />
              Exportar a Excel
            </button>
          </div>
        </div>
      </header>

      {/* Estado de carga idéntico a Socio, Noticias, Eventos y Registros */}
      {cargando ? (
        <div className="rounded-none border border-slate-200/90 bg-white py-16 text-center shadow-xs">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sidebar border-t-transparent" />
          <p className="text-sm text-slate-600">Cargando padrón de socios...</p>
        </div>
      ) : (
        <>
          {usuarios.length > 0 && (
            <div className="space-y-4">
              <BuscadorSocios filtros={filtros} dispatch={dispatch} opciones={opciones} />

              {/* Pastillas rápidas de estado */}
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por estado del socio">
                <button
                  type="button"
                  onClick={() => {
                    setFiltroEstado("todos");
                    setPagina(1);
                  }}
                  className={claseFiltroEstado(filtroEstado === "todos")}
                >
                  Todos ({conteos.todos})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFiltroEstado("aprobado");
                    setPagina(1);
                  }}
                  className={claseFiltroEstado(filtroEstado === "aprobado")}
                >
                  Aprobados ({conteos.aprobados})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFiltroEstado("inactivo");
                    setPagina(1);
                  }}
                  className={claseFiltroEstado(filtroEstado === "inactivo")}
                >
                  Inactivos ({conteos.inactivos})
                </button>
                {conteos.mora > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroEstado("mora");
                      setPagina(1);
                    }}
                    className={claseFiltroEstado(filtroEstado === "mora")}
                  >
                    Degradados por mora ({conteos.mora})
                  </button>
                )}
              </div>
            </div>
          )}

          <TablaSocios
            columnas={columnas}
            socios={visibles}
            iconoVacio={FaUserGroup}
            mensajeVacio={
              usuarios.length === 0
                ? "Todavía no hay socios registrados en el padrón"
                : "No se encontraron socios con los filtros aplicados"
            }
            subtituloVacio={
              usuarios.length === 0
                ? "Aprobá solicitudes desde la sección Registros para incorporar socios al padrón."
                : "Probá limpiando los filtros o modificando el texto de búsqueda."
            }
          />

          <Paginacion
            pagina={paginaSegura}
            totalPaginas={totalPaginas}
            onCambiar={setPagina}
          />
        </>
      )}

      {socioAEditar && (
        <EditarSocioModal
          key={socioAEditar.id}
          socio={socioAEditar}
          onClose={() => setSocioAEditar(null)}
          onActualizado={recargar}
        />
      )}
    </div>
  );
}
