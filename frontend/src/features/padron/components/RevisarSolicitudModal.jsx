import { useEffect, useState } from "react";
import {
  FaArrowUpRightFromSquare,
  FaAward,
  FaBan,
  FaBuilding,
  FaCalendarDay,
  FaChartBar,
  FaChartLine,
  FaCheck,
  FaCompress,
  FaEnvelope,
  FaExpand,
  FaFilePdf,
  FaGears,
  FaIdCard,
  FaLocationDot,
  FaPhone,
  FaXmark,
} from "react-icons/fa6";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import dayjs from "@/shared/utils/fechas";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import { etiquetaTamano } from "@/features/area-socio/utils/empresa";
import VisorConstancia from "./VisorConstancia";

/**
 * Modal de revisión de solicitud de alta de socio.
 * Unificado con el diseño de Socio (EventoDetalleModal / NoticiaModal):
 * muestra la ficha institucional completa del solicitante + el visor de constancia AFIP/DGR.
 */
export default function RevisarSolicitudModal({ socio, onClose, onDecision, procesando }) {
  useBloquearScroll(true);

  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [confirmandoRechazo, setConfirmandoRechazo] = useState(false);

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === "Escape" && !confirmandoRechazo) onClose();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onClose, confirmandoRechazo]);

  const constanciaSegura =
    socio.constanciaUrl && socio.constanciaUrl.includes("res.cloudinary.com")
      ? socio.constanciaUrl
      : null;

  const datosSolicitante = [
    { icono: FaIdCard, etiqueta: "CUIT", valor: socio.cuit },
    { icono: FaAward, etiqueta: "Categoría solicitada", valor: socio.categoria, capitalize: true },
    { icono: FaGears, etiqueta: "Rubro", valor: socio.rubro },
    {
      icono: FaChartBar,
      etiqueta: "Tamaño de empresa",
      valor: etiquetaTamano(socio.tamano_empresa),
    },
    { icono: FaLocationDot, etiqueta: "Localidad", valor: socio.localidad },
    { icono: FaPhone, etiqueta: "Teléfono", valor: socio.telefono },
    { icono: FaEnvelope, etiqueta: "Correo electrónico", valor: socio.email },
    {
      icono: FaCalendarDay,
      etiqueta: "Fecha de solicitud",
      valor: socio.createdAt ? dayjs(socio.createdAt).format("DD/MM/YYYY HH:mm") : "No informada",
    },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-3 backdrop-blur-xs sm:p-6"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className={`animacion-modal flex flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl transition-all duration-300 ${
            pantallaCompleta
              ? "h-full w-full rounded-none p-4 sm:p-6"
              : "max-h-[92vh] w-full max-w-5xl rounded-2xl p-5 sm:p-7"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={`Revisar solicitud de ${socio.razonSocial}`}
        >
          {/* Cabecera estilo Socio */}
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-blue px-2.5 py-1 text-xs font-bold text-primary">
                  <FaBuilding className="text-[11px]" /> Solicitud de alta de socio
                </span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold capitalize text-amber-800">
                  Pendiente de revisión
                </span>
              </div>

              <h2 className="mt-2 truncate text-xl font-bold leading-snug text-navy sm:text-2xl">
                {socio.razonSocial}
              </h2>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPantallaCompleta((v) => !v)}
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                title={pantallaCompleta ? "Restaurar tamaño" : "Expandir ventana"}
                aria-label={pantallaCompleta ? "Restaurar tamaño" : "Expandir ventana"}
              >
                {pantallaCompleta ? <FaCompress /> : <FaExpand />}
              </button>

              <button
                type="button"
                aria-label="Cerrar ventana"
                onClick={onClose}
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <FaXmark className="text-xl" />
              </button>
            </div>
          </div>

          {/* Cuerpo: Ficha de datos + Visor de constancia */}
          <div className="mt-4 flex flex-1 flex-col gap-5 overflow-y-auto lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:overflow-hidden">
            {/* Columna izquierda: Datos declarados por la empresa */}
            <div className="flex shrink-0 flex-col gap-3 pr-0.5 lg:shrink lg:overflow-y-auto">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Datos institucionales declarados
              </p>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                {datosSolicitante.map(({ icono: Icono, etiqueta, valor, capitalize }) => (
                  <div
                    key={etiqueta}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-surface p-3"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-blue text-primary">
                      <Icono className="text-sm" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {etiqueta}
                      </p>
                      <p
                        className={`truncate text-xs font-bold text-navy sm:text-sm ${
                          capitalize ? "capitalize" : ""
                        }`}
                        title={valor || "No informado"}
                      >
                        {valor || "No informado"}
                      </p>
                    </div>
                  </div>
                ))}

                {socio.actividad && (
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-surface p-3 sm:col-span-2 lg:col-span-1">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-blue text-primary">
                      <FaChartLine className="text-sm" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Actividad principal
                      </p>
                      <p className="text-xs font-bold text-navy sm:text-sm">{socio.actividad}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha: Visor de constancia AFIP / DGR */}
            <div className="flex min-h-[360px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-surface lg:min-h-0 lg:shrink">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-4 py-2.5">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy">
                  <FaFilePdf className="text-red-500" /> Constancia de inscripción AFIP / DGR
                </span>

                {constanciaSegura && (
                  <a
                    href={constanciaSegura}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-surface-blue px-2.5 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    Abrir en pestaña nueva <FaArrowUpRightFromSquare className="text-[10px]" />
                  </a>
                )}
              </div>

              <div className="flex flex-1 items-center justify-center overflow-hidden">
                <VisorConstancia url={socio.constanciaUrl} razonSocial={socio.razonSocial} />
              </div>
            </div>
          </div>

          {/* Pie de acciones */}
          <div className="mt-5 flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={procesando}
              onClick={() => setConfirmandoRechazo(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <FaBan className="text-xs" /> Rechazar solicitud
            </button>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onClose}
                disabled={procesando}
                className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cerrar
              </button>

              <button
                type="button"
                disabled={procesando}
                onClick={() => onDecision(socio.id, "aprobado")}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                <FaCheck className="text-xs" />
                {procesando ? "Procesando..." : "Aprobar socio"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmandoRechazo}
        icono={FaBan}
        titulo="¿Rechazar esta solicitud?"
        mensaje={`Estás a punto de rechazar la solicitud de registro de "${socio.razonSocial}" (CUIT: ${socio.cuit}).`}
        textoConfirmar={procesando ? "Rechazando..." : "Sí, rechazar"}
        onCancelar={() => setConfirmandoRechazo(false)}
        onConfirmar={() => {
          setConfirmandoRechazo(false);
          onDecision(socio.id, "rechazado");
        }}
      />
    </>
  );
}
