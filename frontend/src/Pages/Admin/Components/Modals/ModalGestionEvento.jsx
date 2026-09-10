import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaRegSave, FaTimes, FaInfoCircle, FaTrashAlt } from "react-icons/fa";
import { toast } from "sonner";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { crearNuevoEvento, actualizarEvento, eliminarEvento } from "../../../../services/adminServices.js"; 
import ModalConfirmacion from "./ModalConfirmacion.jsx"; // <-- Importamos nuestro nuevo componente

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function ClicEnMapa({ onLocationSelected }) {
    const [posicion, setPosicion] = useState(null);
    useMapEvents({
        click(e) {
            setPosicion(e.latlng);
            onLocationSelected(e.latlng);
        },
    });
    return posicion === null ? null : <Marker position={posicion}></Marker>;
}

dayjs.locale("es");

export default function ModalGestionEvento({ onClose, modo, fechaPredefinida, eventoExistente, onActualizado }) {
    const [procesando, setProcesando] = useState(false);
    
    // Estado para controlar la visibilidad del modal de confirmación personalizado
    const [modalConfirmacionAbierto, setModalConfirmacionAbierto] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            titulo: eventoExistente?.titulo || "",
            descripcion: eventoExistente?.descripcion || "",
            fecha: eventoExistente?.fecha || (fechaPredefinida ? fechaPredefinida.format("YYYY-MM-DD") : ""),
            horaInicio: eventoExistente?.horaInicio || "",
            horaFin: eventoExistente?.horaFin || "",
            modalidad: eventoExistente?.modalidad || "presencial",
            cupoMaximo: eventoExistente?.cupoMaximo || "",
            estado: eventoExistente?.estado || "programado",
            lugar: eventoExistente?.lugar || ""
        }
    });

    const fechaForm = watch("fecha");
    const horaInicioForm = watch("horaInicio");
    const horaFinForm = watch("horaFin");

    const onSubmit = async (data) => {
        if (data.cupoMaximo !== "" && parseInt(data.cupoMaximo) <= 10) {
            toast.error("El cupo máximo debe ser mayor a 10 (o dejarlo vacío si es sin límite).");
            return;
        }

        setProcesando(true);

        try {
            const formData = new FormData();
            formData.append("titulo", data.titulo);
            formData.append("descripcion", data.descripcion);
            formData.append("fecha", data.fecha);
            formData.append("modalidad", data.modalidad);
            formData.append("estado", data.estado);
            formData.append("lugar", data.lugar);
            
            if (data.horaInicio) formData.append("horaInicio", data.horaInicio);
            if (data.horaFin) formData.append("horaFin", data.horaFin);
            if (data.cupoMaximo) formData.append("cupoMaximo", data.cupoMaximo);

            if (data.imagen && data.imagen.length > 0) {
                formData.append("imagen", data.imagen[0]); 
            }

            let result;
            if (modo === "crear") {
                result = await crearNuevoEvento(formData);
            } else {
                result = await actualizarEvento(eventoExistente.id, formData);
            }

            if (result.exito) {
                toast.success(modo === "crear" ? "¡Evento creado exitosamente!" : "¡Evento actualizado!");
                if (onActualizado) onActualizado(); 
                onClose();
            } else {
                toast.error(result.mensaje || "Ocurrió un error al guardar.");
            }
        } catch (error) {
            toast.error("Error de conexión con el servidor.");
        } finally {
            setProcesando(false);
        }
    };

    // Función que ejecuta la llamada real al backend al presionar "Eliminar" en el modal custom
    const ejecutarEliminacion = async () => {
        setProcesando(true);
        try {
            const result = await eliminarEvento(eventoExistente.id);
            if (result.exito) {
                toast.success("Evento eliminado correctamente.");
                if (onActualizado) onActualizado();
                setModalConfirmacionAbierto(false);
                onClose(); // Cierra también el modal principal de edición
            } else {
                toast.error(result.mensaje || "Error al eliminar el evento.");
            }
        } catch (error) {
            toast.error("Error de conexión con el servidor.");
        } finally {
            setProcesando(false);
        }
    };

    const generarPrevisualizacion = () => {
        if (!fechaForm) return "Seleccioná una fecha para ver el resumen.";
        const diaInicio = dayjs(fechaForm);
        let texto = diaInicio.format("dddd D"); 

        if (horaInicioForm) {
            const [hInicio, mInicio] = horaInicioForm.split(":");
            const fechaHoraInicio = diaInicio.hour(hInicio).minute(mInicio);
            texto += `, ${fechaHoraInicio.format("h:mm a")}`;

            if (horaFinForm) {
                const [hFin, mFin] = horaFinForm.split(":");
                let fechaHoraFin = diaInicio.hour(hFin).minute(mFin);

                if (fechaHoraFin.isBefore(fechaHoraInicio)) {
                    fechaHoraFin = fechaHoraFin.add(1, "day");
                }
                texto += ` hasta ${fechaHoraFin.format("dddd D, h:mm a")}`;
            }
        }
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    };

    const handleLocationSelected = (latlng) => {
        const urlGoogleMaps = `https://www.google.com/maps?q=${latlng.lat},${latlng.lng}`;
        setValue("lugar", urlGoogleMaps, { shouldValidate: true });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animacion-modal">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden relative max-h-[90vh]">
                
                <div className="bg-[#132A46] p-4 text-white flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold">
                        {modo === "crear" ? "Crear Nuevo Evento" : `Editar Evento`}
                    </h3>
                    <button onClick={onClose} className="text-gray-300 hover:text-white text-2xl font-bold transition-colors">
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto flex flex-col gap-5">
                    
                    <div className="flex flex-col gap-1">
                        <label className="font-bold text-gray-700 text-sm">Título del Evento *</label>
                        <input type="text" {...register("titulo", { required: true })} placeholder="Ej. Capacitación en Marketing Digital" className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#1D7BB6]" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="font-bold text-gray-700 text-sm">Descripción *</label>
                        <textarea {...register("descripcion", { required: true })} rows="3" placeholder="Detalles del evento..." className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#1D7BB6] resize-none"></textarea>
                    </div>

                    <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="font-bold text-gray-700 text-sm">Fecha *</label>
                                <input type="date" {...register("fecha", { required: true })} className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#1D7BB6]" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="font-bold text-gray-700 text-sm">Hora Inicio</label>
                                <input type="time" {...register("horaInicio")} className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#1D7BB6]" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="font-bold text-gray-700 text-sm">Hora Fin</label>
                                <input type="time" {...register("horaFin")} className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#1D7BB6]" />
                            </div>
                        </div>
                        <div className="text-sm font-medium text-[#1D7BB6] bg-blue-50 py-1.5 px-3 rounded-md inline-block self-start mt-1 shadow-sm">
                            {generarPrevisualizacion()}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-gray-700 text-sm">Modalidad</label>
                            <select {...register("modalidad")} className="p-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:border-[#1D7BB6]">
                                <option value="presencial">Presencial</option>
                                <option value="virtual">Virtual</option>
                                <option value="hibrido">Híbrido</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-gray-700 text-sm">Cupo Máximo</label>
                            <input type="number" {...register("cupoMaximo")} min="11" placeholder="Mínimo 11 (vacío = sin límite)" className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#1D7BB6]" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-gray-700 text-sm">Estado</label>
                            {modo === "crear" ? (
                                <div className="p-2 border border-gray-200 bg-gray-100 text-gray-600 rounded-md text-sm font-medium flex items-center gap-2 cursor-not-allowed h-full">
                                    <FaInfoCircle className="text-[#1D7BB6]"/> Programado
                                </div>
                            ) : (
                                <select {...register("estado")} className="p-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:border-[#1D7BB6] h-full">
                                    <option value="programado">Programado</option>
                                    <option value="cancelado">Cancelado</option>
                                    <option value="finalizado">Finalizado</option>
                                </select>
                            )}
                        </div>
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
                            <MapContainer center={[-26.1848, -58.1731]} zoom={13} style={{ height: "100%", width: "100%" }}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <ClicEnMapa onLocationSelected={handleLocationSelected} />
                            </MapContainer>
                        </div>

                        <input 
                            type="text" 
                            {...register("lugar", { required: true })} 
                            placeholder="URL generada o dirección física..." 
                            className={`p-2 border rounded-md text-sm focus:outline-none focus:border-[#1D7BB6] ${errors.lugar ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} 
                        />
                    </div>

                    <div className="flex flex-col gap-1 mt-2">
                        <label className="font-bold text-gray-700 text-sm">Banner / Imagen Promocional</label>
                        <input type="file" {...register("imagen")} accept="image/*" className="p-2 border border-gray-300 rounded-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#1D7BB6] file:text-white hover:file:bg-[#156091] cursor-pointer" />
                    </div>

                    <div className="pt-4 mt-2 border-t border-gray-200 flex justify-between items-center gap-3">
                        {modo === "editar" ? (
                            <button 
                                type="button" 
                                onClick={() => setModalConfirmacionAbierto(true)} // <-- Abrimos nuestro modal custom
                                disabled={procesando} 
                                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-md text-sm transition-colors flex items-center gap-2 border border-red-200"
                            >
                                <FaTrashAlt /> Eliminar Evento
                            </button>
                        ) : (
                            <div></div> 
                        )}
                        
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} disabled={procesando} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-md text-sm transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" disabled={procesando} className="px-5 py-2 bg-[#00B859] hover:bg-[#009649] text-white font-semibold rounded-md flex items-center gap-2 text-sm shadow-sm transition-colors disabled:opacity-50">
                                <FaRegSave /> {procesando ? "Guardando..." : modo === "crear" ? "Guardar Evento" : "Actualizar Evento"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* MODAL DE CONFIRMACIÓN CUSTOM */}
            <ModalConfirmacion 
                isOpen={modalConfirmacionAbierto}
                titulo="¿Estás seguro de eliminar este evento?"
                mensaje={`Estás a punto de eliminar el evento '${eventoExistente?.titulo || ""}' programado para el ${dayjs(eventoExistente?.fecha).format("DD/MM/YYYY")}. Esta acción no se puede deshacer.`}
                onCancelar={() => setModalConfirmacionAbierto(false)}
                onConfirmar={ejecutarEliminacion}
            />
        </div>
    );
}