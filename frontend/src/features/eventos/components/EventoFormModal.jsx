import { lazy, Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { FaRegSave, FaInfoCircle, FaTrashAlt } from "react-icons/fa";
import { toast } from "sonner";
import dayjs from "@/shared/utils/fechas";
import { crearNuevoEvento, actualizarEvento, eliminarEvento } from "@/services/eventosService";
import ModalShell from "@/shared/ui/ModalShell";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import Campo from "@/shared/ui/Campo";
import { inputClase, btnCancelarClase, btnGuardarClase } from "@/shared/ui/estilos";
import { resumenHorario } from "../utils/resumenHorario";

const MapaUbicacion = lazy(() => import("./MapaUbicacion"));

dayjs.locale("es");

function valoresIniciales(evento, fechaPredefinida) {
  return {
    titulo: evento?.titulo || "",
    descripcion: evento?.descripcion || "",
    fecha: evento?.fecha || (fechaPredefinida ? fechaPredefinida.format("YYYY-MM-DD") : ""),
    horaInicio: evento?.horaInicio || "",
    horaFin: evento?.horaFin || "",
    modalidad: evento?.modalidad || "presencial",
    cupoMaximo: evento?.cupoMaximo || "",
    estado: evento?.estado || "programado",
    lugar: evento?.lugar || "",
  };
}

function armarFormData(data) {
  const fd = new FormData();
  ["titulo", "descripcion", "fecha", "modalidad", "estado", "lugar"].forEach((k) => fd.append(k, data[k]));
  if (data.horaInicio) fd.append("horaInicio", data.horaInicio);
  if (data.horaFin) fd.append("horaFin", data.horaFin);
  if (data.cupoMaximo) fd.append("cupoMaximo", data.cupoMaximo);
  if (data.imagen && data.imagen.length > 0) fd.append("imagen", data.imagen[0]);
  return fd;
}

export default function EventoFormModal({ onClose, modo, fechaPredefinida, eventoExistente, onActualizado }) {
  const [procesando, setProcesando] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const esCrear = modo === "crear";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: valoresIniciales(eventoExistente, fechaPredefinida) });

  const [fecha, horaInicio, horaFin] = watch(["fecha", "horaInicio", "horaFin"]);

  // api() nunca lanza: se revisa result.exito (no hace falta try/catch).
  const finalizar = (result, okMsg, errMsg) => {
    if (result.exito) {
      toast.success(okMsg);
      onActualizado?.();
      onClose();
    } else {
      toast.error(result.mensaje || errMsg);
    }
  };

  const onSubmit = async (data) => {
    if (data.cupoMaximo !== "" && parseInt(data.cupoMaximo, 10) <= 10) {
      toast.error("El cupo máximo debe ser mayor a 10 (o dejarlo vacío si es sin límite).");
      return;
    }
    setProcesando(true);
    const fd = armarFormData(data);
    const result = esCrear ? await crearNuevoEvento(fd) : await actualizarEvento(eventoExistente.id, fd);
    setProcesando(false);
    finalizar(
      result,
      esCrear ? "¡Evento creado exitosamente!" : "¡Evento actualizado!",
      "Ocurrió un error al guardar.",
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

  return (
    <>
      <ModalShell titulo={esCrear ? "Crear Nuevo Evento" : "Editar Evento"} onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto flex flex-col gap-5">
          <Campo label="Título del Evento *">
            <input
              type="text"
              {...register("titulo", { required: true })}
              placeholder="Ej. Capacitación en Marketing Digital"
              className={inputClase}
            />
          </Campo>

          <Campo label="Descripción *">
            <textarea
              {...register("descripcion", { required: true })}
              rows="3"
              placeholder="Detalles del evento..."
              className={`${inputClase} resize-none`}
            />
          </Campo>

          <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <Campo label="Fecha *">
                <input type="date" {...register("fecha", { required: true })} className={inputClase} />
              </Campo>
              <Campo label="Hora Inicio">
                <input type="time" {...register("horaInicio")} className={inputClase} />
              </Campo>
              <Campo label="Hora Fin">
                <input type="time" {...register("horaFin")} className={inputClase} />
              </Campo>
            </div>
            <div className="text-sm font-medium text-primary bg-blue-50 py-1.5 px-3 rounded-md inline-block self-start mt-1 shadow-sm">
              {resumenHorario(fecha, horaInicio, horaFin)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Campo label="Modalidad">
              <select {...register("modalidad")} className={inputClase}>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </Campo>
            <Campo label="Cupo Máximo">
              <input
                type="number"
                {...register("cupoMaximo")}
                min="11"
                placeholder="Mínimo 11 (vacío = sin límite)"
                className={inputClase}
              />
            </Campo>
            <Campo label="Estado">
              {esCrear ? (
                <div className="p-2 border border-gray-200 bg-gray-100 text-gray-600 rounded-md text-sm font-medium flex items-center gap-2 cursor-not-allowed h-full">
                  <FaInfoCircle className="text-primary" /> Programado
                </div>
              ) : (
                <select {...register("estado")} className={`${inputClase} h-full`}>
                  <option value="programado">Programado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              )}
            </Campo>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700 text-sm flex justify-between">
              Lugar / Enlace *
              {errors.lugar && <span className="text-red-500 text-xs font-normal">Este campo es obligatorio</span>}
            </label>
            <p className="text-xs text-gray-500 -mt-1">
              Hacé clic en el mapa para fijar el punto exacto, o pegá un enlace manualmente.
            </p>

            <div className="h-48 w-full rounded-md border border-gray-300 overflow-hidden relative z-0">
              <Suspense fallback={<div className="h-full flex items-center justify-center text-sm text-gray-400">Cargando mapa…</div>}>
                <MapaUbicacion onSeleccion={alElegirEnMapa} />
              </Suspense>
            </div>

            <input
              type="text"
              {...register("lugar", { required: true })}
              placeholder="URL generada o dirección física..."
              className={`${inputClase} ${errors.lugar ? "border-red-500 bg-red-50" : ""}`}
            />
          </div>

          <Campo label="Banner / Imagen Promocional" className="mt-2">
            <input
              type="file"
              {...register("imagen")}
              accept="image/*"
              className="p-2 border border-gray-300 rounded-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
            />
          </Campo>

          <div className="pt-4 mt-2 border-t border-gray-200 flex justify-between items-center gap-3">
            {esCrear ? (
              <div />
            ) : (
              <button
                type="button"
                onClick={() => setConfirmandoBorrado(true)}
                disabled={procesando}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-md text-sm transition-colors flex items-center gap-2 border border-red-200"
              >
                <FaTrashAlt /> Eliminar Evento
              </button>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={procesando} className={btnCancelarClase}>
                Cancelar
              </button>
              <button type="submit" disabled={procesando} className={btnGuardarClase}>
                <FaRegSave /> {procesando ? "Guardando..." : esCrear ? "Guardar Evento" : "Actualizar Evento"}
              </button>
            </div>
          </div>
        </form>
      </ModalShell>

      <ConfirmDialog
        isOpen={confirmandoBorrado}
        titulo="¿Estás seguro de eliminar este evento?"
        mensaje={`Estás a punto de eliminar el evento '${eventoExistente?.titulo || ""}' programado para el ${dayjs(eventoExistente?.fecha).format("DD/MM/YYYY")}. Esta acción no se puede deshacer.`}
        onCancelar={() => setConfirmandoBorrado(false)}
        onConfirmar={ejecutarEliminacion}
      />
    </>
  );
}
