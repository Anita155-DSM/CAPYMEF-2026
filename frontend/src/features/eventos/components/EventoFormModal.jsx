import { lazy, Suspense, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  FaCalendarCheck,
  FaClock,
  FaFloppyDisk,
  FaImage,
  FaLocationDot,
  FaPlus,
  FaTrashCan,
  FaUsers,
  FaVideo,
  FaXmark,
} from "react-icons/fa6";
import { toast } from "sonner";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import dayjs from "@/shared/utils/fechas";
import { urlImagen } from "@/shared/utils/imagenes";
import { crearNuevoEvento, actualizarEvento, eliminarEvento } from "@/services/eventosService";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import { resumenHorario } from "../utils/resumenHorario";

const MapaUbicacion = lazy(() => import("./MapaUbicacion"));

dayjs.locale("es");

const inputClase =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-navy placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors";

const labelClase = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500";

function parsearLogosIniciales(logosExternos) {
  if (!logosExternos) return [];
  if (Array.isArray(logosExternos)) return logosExternos;
  try {
    const parsed = JSON.parse(logosExternos);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function valoresIniciales(evento, fechaPredefinida) {
  return {
    titulo: evento?.titulo || "",
    descripcion: evento?.descripcion || "",
    fecha: evento?.fecha
      ? evento.fecha.split("T")[0]
      : fechaPredefinida
      ? fechaPredefinida.format("YYYY-MM-DD")
      : "",
    horaInicio: evento?.horaInicio ? evento.horaInicio.slice(0, 5) : "",
    horaFin: evento?.horaFin ? evento.horaFin.slice(0, 5) : "",
    modalidad: evento?.modalidad === "virtual" ? "virtual" : "presencial",
    cupoMaximo: evento?.cupoMaximo ?? "",
    estado: evento?.estado || "programado",
    lugar: evento?.lugar || "",
  };
}

function armarFormData(data, logos) {
  const fd = new FormData();
  ["titulo", "descripcion", "fecha", "modalidad", "estado", "lugar"].forEach((k) =>
    fd.append(k, data[k] ?? "")
  );
  if (data.horaInicio) fd.append("horaInicio", data.horaInicio);
  if (data.horaFin) fd.append("horaFin", data.horaFin);
  if (data.cupoMaximo !== "" && data.cupoMaximo !== null && data.cupoMaximo !== undefined) {
    fd.append("cupoMaximo", data.cupoMaximo);
  }
  fd.append("logosExternos", JSON.stringify(logos));
  if (data.imagen && data.imagen.length > 0) fd.append("imagen", data.imagen[0]);
  return fd;
}

export default function EventoFormModal({
  onClose,
  modo,
  fechaPredefinida,
  eventoExistente,
  onActualizado,
  onVerInscriptos,
}) {
  useBloquearScroll(true);

  const [procesando, setProcesando] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [logos, setLogos] = useState(() => parsearLogosIniciales(eventoExistente?.logosExternos));
  const [nuevoLogoUrl, setNuevoLogoUrl] = useState("");
  const esCrear = modo === "crear";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: valoresIniciales(eventoExistente, fechaPredefinida) });

  const [fecha, horaInicio, horaFin, modalidad] = useWatch({
    control,
    name: ["fecha", "horaInicio", "horaFin", "modalidad"],
  });

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === "Escape" && !confirmandoBorrado) onClose();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onClose, confirmandoBorrado]);

  const finalizar = (result, okMsg, errMsg) => {
    if (result.exito) {
      toast.success(okMsg);
      onActualizado?.();
      onClose();
    } else {
      const detalle = Array.isArray(result.errores) && result.errores[0]?.mensaje;
      toast.error(detalle || result.mensaje || errMsg);
    }
  };

  const onSubmit = async (data) => {
    if (data.cupoMaximo !== "" && parseInt(data.cupoMaximo, 10) < 1) {
      toast.error("El cupo máximo debe ser un número mayor a 0 (o dejarlo vacío si es sin límite).");
      return;
    }
    setProcesando(true);
    const fd = armarFormData(data, logos);
    const result = esCrear
      ? await crearNuevoEvento(fd)
      : await actualizarEvento(eventoExistente.id, fd);
    setProcesando(false);
    finalizar(
      result,
      esCrear ? "¡Evento creado exitosamente!" : "¡Evento actualizado correctamente!",
      "Ocurrió un error al guardar el evento."
    );
  };

  const ejecutarEliminacion = async () => {
    setProcesando(true);
    const result = await eliminarEvento(eventoExistente.id);
    setProcesando(false);
    setConfirmandoBorrado(false);
    finalizar(result, "Evento eliminado correctamente.", "Error al eliminar el evento.");
  };

  const alElegirEnMapa = ({ lat, lng }) =>
    setValue("lugar", `https://www.google.com/maps?q=${lat},${lng}`, { shouldValidate: true });

  const agregarLogo = () => {
    const limpio = nuevoLogoUrl.trim();
    if (!limpio) return;
    if (!/^https?:\/\/.+/i.test(limpio)) {
      toast.error("Ingresá un enlace válido que comience con http:// o https://");
      return;
    }
    setLogos((prev) => [...prev, limpio]);
    setNuevoLogoUrl("");
  };

  const quitarLogo = (idx) => {
    setLogos((prev) => prev.filter((_, i) => i !== idx));
  };

  const imagenActual = !esCrear ? urlImagen(eventoExistente?.imagenUrl) : null;
  const esVirtual = modalidad === "virtual";

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs sm:p-6"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="animacion-modal max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:max-w-3xl sm:p-7"
          role="dialog"
          aria-modal="true"
          aria-label={esCrear ? "Crear nuevo evento" : "Editar evento"}
        >
          {/* Cabecera idéntica a EventoDetalleModal de Socios */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-blue px-2.5 py-1 text-xs font-bold text-primary">
                {esVirtual ? (
                  <FaVideo className="text-[11px]" />
                ) : (
                  <FaCalendarCheck className="text-[11px]" />
                )}
                {esCrear ? "Nueva actividad institucional" : "Edición de actividad"}
              </span>

              {!esCrear && eventoExistente?.estado && (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                    eventoExistente.estado === "finalizado"
                      ? "bg-gray-100 text-gray-600"
                      : eventoExistente.estado === "cancelado"
                      ? "bg-red-50 text-red-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {eventoExistente.estado}
                </span>
              )}
            </div>

            <button
              type="button"
              aria-label="Cerrar ventana"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <FaXmark className="text-xl" />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold leading-snug text-navy sm:text-2xl">
              {esCrear ? "Programar evento o capacitación" : eventoExistente?.titulo || "Editar evento"}
            </h2>

            {!esCrear && onVerInscriptos && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onVerInscriptos(eventoExistente);
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary/25 bg-surface-blue px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                <FaUsers className="text-[11px]" /> Inscriptos y asistencia
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5">
            {/* Datos principales */}
            <div className="space-y-4">
              <div>
                <label className={labelClase}>
                  Título del evento *
                  {errors.titulo && (
                    <span className="ml-2 font-normal normal-case text-red-500">
                      (Mínimo 5 caracteres)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  {...register("titulo", { required: true, minLength: 5, maxLength: 200 })}
                  placeholder="Ej. Capacitación en Marketing Digital y Ventas PyME"
                  className={`${inputClase} ${errors.titulo ? "border-red-400 bg-red-50/40" : ""}`}
                />
              </div>

              <div>
                <label className={labelClase}>
                  Descripción y temario *
                  {errors.descripcion && (
                    <span className="ml-2 font-normal normal-case text-red-500">
                      (Obligatorio)
                    </span>
                  )}
                </label>
                <textarea
                  {...register("descripcion", { required: true })}
                  rows="3"
                  placeholder="Detallá los objetivos, disertantes y temas de la jornada..."
                  className={`${inputClase} resize-none ${
                    errors.descripcion ? "border-red-400 bg-red-50/40" : ""
                  }`}
                />
              </div>
            </div>

            {/* Bloque estructurado de Fecha y Horario (estilo ficha de Socios) */}
            <div className="rounded-xl border border-gray-100 bg-surface p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClase}>Fecha *</label>
                  <input
                    type="date"
                    {...register("fecha", { required: true })}
                    className={inputClase}
                  />
                </div>
                <div>
                  <label className={labelClase}>Hora de inicio</label>
                  <input type="time" {...register("horaInicio")} className={inputClase} />
                </div>
                <div>
                  <label className={labelClase}>Hora de fin</label>
                  <input type="time" {...register("horaFin")} className={inputClase} />
                </div>
              </div>

              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-surface-blue px-3 py-1.5 text-xs font-semibold text-primary">
                <FaClock className="shrink-0" />
                <span>{resumenHorario(fecha, horaInicio, horaFin)}</span>
              </div>
            </div>

            {/* Modalidad, Cupo y Estado */}
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-surface p-4 sm:grid-cols-3 sm:p-5">
              <div>
                <label className={labelClase}>Modalidad</label>
                <select {...register("modalidad")} className={inputClase}>
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>

              <div>
                <label className={labelClase}>Cupo máximo</label>
                <input
                  type="number"
                  {...register("cupoMaximo")}
                  min="1"
                  placeholder="Vacío = sin límite"
                  className={inputClase}
                />
              </div>

              <div>
                <label className={labelClase}>Estado</label>
                {esCrear ? (
                  <div className="flex h-[38px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-100/80 px-3.5 text-xs font-semibold text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-primary" /> Programado
                  </div>
                ) : (
                  <select {...register("estado")} className={inputClase}>
                    <option value="programado">Programado</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                )}
              </div>
            </div>

            {/* Lugar o Enlace + Mapa interactivo */}
            <div className="rounded-xl border border-gray-100 bg-surface p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <label className={labelClase}>
                  <span className="inline-flex items-center gap-1.5">
                    {esVirtual ? (
                      <FaVideo className="text-primary" />
                    ) : (
                      <FaLocationDot className="text-primary" />
                    )}
                    {esVirtual
                      ? "Enlace o plataforma de reunión"
                      : "Ubicación o dirección del encuentro"}
                  </span>
                </label>
              </div>

              {!esVirtual && (
                <>
                  <p className="mb-2.5 text-xs text-slate-500">
                    Hacé clic en el mapa para fijar la ubicación exacta en Google Maps o escribí la dirección debajo.
                  </p>
                  <div className="relative z-0 mb-3 h-48 w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <Suspense
                      fallback={
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                          Cargando mapa interactivo...
                        </div>
                      }
                    >
                      <MapaUbicacion onSeleccion={alElegirEnMapa} />
                    </Suspense>
                  </div>
                </>
              )}

              <input
                type="text"
                {...register("lugar")}
                placeholder={
                  esVirtual
                    ? "Ej. https://meet.google.com/... o Zoom"
                    : "Dirección física o enlace de Google Maps..."
                }
                className={inputClase}
              />
            </div>

            {/* Imagen promocional y Logos auspiciantes */}
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-surface p-4 sm:grid-cols-2 sm:p-5">
              <div>
                <label className={labelClase}>
                  <span className="inline-flex items-center gap-1.5">
                    <FaImage className="text-primary" /> Banner / Imagen promocional
                  </span>
                </label>
                {imagenActual && (
                  <img
                    src={imagenActual}
                    alt={eventoExistente?.titulo || "Banner actual"}
                    className="mb-2.5 h-24 w-full rounded-lg border border-slate-200 object-cover"
                  />
                )}
                <input
                  type="file"
                  {...register("imagen")}
                  accept="image/*"
                  className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1.5 text-xs text-slate-600 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-primary-dark"
                />
              </div>

              <div>
                <label className={labelClase}>Logos co-organizadores (URLs opcionales)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={nuevoLogoUrl}
                    onChange={(e) => setNuevoLogoUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        agregarLogo();
                      }
                    }}
                    placeholder="https://.../logo.png"
                    className={inputClase}
                  />
                  <button
                    type="button"
                    onClick={agregarLogo}
                    className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-primary/30 bg-surface-blue px-3 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                    title="Agregar logo"
                  >
                    <FaPlus />
                  </button>
                </div>

                {logos.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {logos.map((logoUrl, idx) => (
                      <div
                        key={`${logoUrl}-${idx}`}
                        className="group relative flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1"
                      >
                        <img
                          src={logoUrl}
                          alt="Logo externo"
                          className="h-6 max-w-[70px] object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => quitarLogo(idx)}
                          className="text-slate-400 transition-colors hover:text-red-600"
                          title="Quitar logo"
                        >
                          <FaXmark className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pie de acciones idéntico al estilo de Socios */}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              {esCrear ? (
                <div />
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmandoBorrado(true)}
                  disabled={procesando}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <FaTrashCan className="text-xs" /> Eliminar evento
                </button>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={procesando}
                  className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
                >
                  <FaFloppyDisk className="text-xs" />
                  {procesando
                    ? "Guardando..."
                    : esCrear
                    ? "Guardar evento"
                    : "Guardar cambios"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmandoBorrado}
        titulo="¿Eliminar este evento?"
        mensaje={`Estás a punto de eliminar "${
          eventoExistente?.titulo || ""
        }" programado para el ${dayjs(eventoExistente?.fecha).format(
          "DD/MM/YYYY"
        )}. Esta acción no se puede deshacer.`}
        onCancelar={() => setConfirmandoBorrado(false)}
        onConfirmar={ejecutarEliminacion}
      />
    </>
  );
}
