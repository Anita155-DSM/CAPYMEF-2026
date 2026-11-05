import { useState } from "react";
import { FaClipboardCheck, FaEye } from "react-icons/fa6";
import { toast } from "sonner";
import dayjs from "@/shared/utils/fechas";
import { gestionarEstadoSolicitud } from "@/services/adminServices";
import BuscadorSocios from "../components/BuscadorSocios";
import TablaSocios from "../components/TablaSocios";
import RevisarSolicitudModal from "../components/RevisarSolicitudModal";
import { useBuscador } from "../hooks/useBuscador";
import { useUsuarios } from "../hooks/useUsuarios";

const soloPendientes = (u) => u.estado === "pendiente";

const ESTILO_CATEGORIA = {
  activo: "bg-surface-blue text-primary border-primary/20",
  adherente: "bg-slate-100 text-slate-700 border-slate-200",
  padrino: "bg-amber-50 text-amber-800 border-amber-200",
};

export default function SolicitudesPage() {
  const { usuarios: solicitudes, setUsuarios, cargando } = useUsuarios(soloPendientes);
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const { filtros, dispatch, filtrados, opciones } = useBuscador(solicitudes);

  const handleDecision = async (id, decision) => {
    setProcesando(true);
    const result = await gestionarEstadoSolicitud(id, decision);
    setProcesando(false);

    if (result.exito) {
      toast.success(
        decision === "aprobado"
          ? "¡Solicitud aprobada con éxito! El socio ya forma parte del padrón."
          : "Solicitud rechazada correctamente."
      );
      setUsuarios((prev) => prev.filter((s) => s.id !== id));
      setSocioSeleccionado(null);
    } else {
      toast.error("Error: " + result.mensaje);
    }
  };

  const columnas = [
    {
      titulo: "Razón Social",
      className: "font-semibold text-navy",
      render: (s) => (
        <div>
          <p className="font-semibold text-navy">{s.razonSocial}</p>
          {s.createdAt && (
            <p className="text-[11px] font-normal text-slate-400">
              Solicitado el {dayjs(s.createdAt).format("DD/MM/YYYY")}
            </p>
          )}
        </div>
      ),
    },
    { titulo: "CUIT", className: "tabular-nums text-slate-600", render: (s) => s.cuit },
    { titulo: "Email", render: (s) => s.email },
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
      titulo: "Teléfono",
      className: "",
      render: (s) => (
        <span className="text-xs font-semibold tabular-nums text-primary">
          {s.telefono || "-"}
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
          onClick={() => setSocioSeleccionado(s)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-primary-dark"
        >
          <FaEye className="text-[11px]" /> Revisar
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado institucional idéntico a Noticias y Eventos */}
      <header className="relative overflow-hidden rounded-none border border-primary/15 bg-linear-to-r from-white via-white to-surface-blue p-5 shadow-xs sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/6"
        />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Admisión de Asociados
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
              Solicitudes de registro pendientes
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
              Evaluá la constancia de inscripción AFIP / DGR y los datos institucionales para aprobar o rechazar el alta de nuevas empresas.
            </p>
          </div>

          {!cargando && (
            <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border border-primary/20 bg-white px-4 py-2 text-xs font-semibold text-navy shadow-2xs sm:text-sm">
              <FaClipboardCheck className="text-primary" />
              Pendientes de revisión:{" "}
              <strong className="font-bold text-primary tabular-nums">{solicitudes.length}</strong>
            </span>
          )}
        </div>
      </header>

      {/* Estado de carga idéntico a Socio, Noticias y Eventos */}
      {cargando ? (
        <div className="rounded-none border border-slate-200/90 bg-white py-16 text-center shadow-xs">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sidebar border-t-transparent" />
          <p className="text-sm text-slate-600">Cargando solicitudes de registro...</p>
        </div>
      ) : (
        <>
          {solicitudes.length > 0 && (
            <BuscadorSocios filtros={filtros} dispatch={dispatch} opciones={opciones} />
          )}

          <TablaSocios
            columnas={columnas}
            socios={filtrados}
            iconoVacio={FaClipboardCheck}
            mensajeVacio={
              solicitudes.length === 0
                ? "No hay solicitudes pendientes de revisión en este momento"
                : "No se encontraron solicitudes con los filtros aplicados"
            }
            subtituloVacio={
              solicitudes.length === 0
                ? "Cuando una nueva empresa complete el formulario de registro público, aparecerá aquí para su evaluación."
                : "Probá limpiando los filtros o modificando el texto de búsqueda."
            }
          />
        </>
      )}

      {socioSeleccionado && (
        <RevisarSolicitudModal
          key={socioSeleccionado.id}
          socio={socioSeleccionado}
          onClose={() => setSocioSeleccionado(null)}
          onDecision={handleDecision}
          procesando={procesando}
        />
      )}
    </div>
  );
}
