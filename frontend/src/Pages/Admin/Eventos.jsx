import { useState, useEffect } from "react";
import { FaPlus, FaEdit } from "react-icons/fa";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import ModalGestionEvento from "./Components/Modals/ModalGestionEvento.jsx";
import { obtenerTodosLosEventos } from "../../services/adminServices.js";

dayjs.locale("es");

// 1. UTILIDAD: Función para fusionar clases de Tailwind limpiamente
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// 2. SUB-COMPONENTE: Extraemos la celda del calendario para no ensuciar el componente principal
const CeldaDia = ({ dia, eventoDelDia, esHoy, esSeleccionado, alSeleccionar }) => {
    if (!dia) return <div className="w-10 h-10"></div>;

    const estado = eventoDelDia?.estado?.toLowerCase().trim() || "";

    // Lógica de colores reducida a un objeto o if/else limpios
    let colorFondo = "text-[#132A46] bg-white border border-gray-200 hover:bg-gray-100";
    if (estado === "cancelado") colorFondo = "bg-gray-400 text-white shadow-md";
    else if (esHoy && estado === "programado") colorFondo = "bg-green-500 text-white shadow-md"; // Hoy con evento
    else if (esHoy && !eventoDelDia) colorFondo = "bg-[#1D7BB6] text-white shadow-md"; // Hoy sin evento
    else if (estado === "programado") colorFondo = "bg-yellow-400 text-white shadow-md";
    else if (estado === "finalizado") colorFondo = "bg-red-500 text-white shadow-md";

    return (
        <div className="flex flex-col justify-start items-center relative">
            <div
                onClick={() => alSeleccionar(dia, eventoDelDia)}
                // Usamos 'cn' para combinar las clases base, el color dinámico, y el borde si está seleccionado
                className={cn(
                    "w-10 h-10 flex items-center justify-center text-sm font-medium rounded-full cursor-pointer transition-all transform hover:scale-110 shrink-0",
                    colorFondo,
                    esSeleccionado && "ring-4 ring-[#1D7BB6] ring-offset-2 scale-110 z-10"
                )}
                title={eventoDelDia ? `${eventoDelDia.titulo} (${eventoDelDia.estado})` : "Día libre"}
            >
                {dia}
            </div>
            {eventoDelDia && (
                <span className="absolute top-11 text-[11px] leading-tight font-semibold text-gray-700 w-[120%] truncate px-1 pointer-events-none" title={eventoDelDia.titulo}>
                    {eventoDelDia.titulo}
                </span>
            )}
        </div>
    );
};

// 3. COMPONENTE PRINCIPAL (¡Ahora es cortísimo!)
export default function EventosAdmin() {
    const [fechaVisible, setFechaVisible] = useState(dayjs());
    const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
    const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modoModal, setModoModal] = useState("crear");
    const [eventos, setEventos] = useState([]);

    const cargarEventos = async () => {
        const result = await obtenerTodosLosEventos();
        if (result.exito) setEventos(result.data);
    };

    useEffect(() => { cargarEventos(); }, []);

    const hoy = dayjs();
    const celdasCalendario = [
        ...Array((fechaVisible.startOf("month").day() + 6) % 7).fill(null),
        ...Array.from({ length: fechaVisible.daysInMonth() }, (_, i) => i + 1)
    ];

    const handleSeleccionarDia = (dia, eventoDelDia) => {
        const fechaExacta = fechaVisible.date(dia);
        if (fechaSeleccionada && fechaSeleccionada.isSame(fechaExacta, 'day')) {
            setFechaSeleccionada(null);
            setEventoSeleccionado(null);
        } else {
            setFechaSeleccionada(fechaExacta);
            setEventoSeleccionado(eventoDelDia || null);
        }
    };

    return (
        <div className="p-8 w-full font-sans bg-[#F4F7F9] min-h-screen relative">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-semibold text-[#132A46] uppercase tracking-wide">
                    Gestión de Eventos y Capacitaciones
                </h1>
                <div className="flex gap-3">
                    {fechaSeleccionada && eventoSeleccionado && (
                        <button onClick={() => { setModoModal("editar"); setModalAbierto(true); }} className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold py-2.5 px-5 rounded shadow transition-all">
                            <FaEdit /> Editar Evento
                        </button>
                    )}
                    <button onClick={() => { setModoModal("crear"); setModalAbierto(true); }} className="flex items-center gap-2 bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold py-2.5 px-5 rounded shadow transition-colors">
                        <FaPlus /> Crear Evento
                    </button>
                </div>
            </div>

            <div className="max-w-5xl">
                <div className="flex justify-between items-end border-b-2 border-[#1D7BB6] pb-2 mb-6">
                    <h2 className="text-3xl font-light text-[#1D7BB6] capitalize">{fechaVisible.format("MMMM")}</h2>
                    <span className="text-3xl font-light text-[#1D7BB6]">{fechaVisible.format("YYYY")}</span>
                </div>

                <div className="grid grid-cols-7 gap-4 text-center mb-6">
                    {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((dia) => (
                        <div key={dia} className="font-bold text-[#1D7BB6] text-sm">{dia}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-8 gap-x-4 text-center border-b-2 border-[#1D7BB6] pb-12">
                    {celdasCalendario.map((dia, index) => {
                        const esHoy = dia === hoy.date() && fechaVisible.isSame(hoy, 'month');
                        const esSeleccionado = dia && fechaSeleccionada && fechaSeleccionada.date() === dia && fechaVisible.isSame(fechaSeleccionada, 'month');

                        const eventoDelDia = dia ? eventos.find(evt => evt.fecha && evt.fecha.split('T')[0] === fechaVisible.date(dia).format("YYYY-MM-DD")) : null;

                        return (
                            <CeldaDia
                                key={index}
                                dia={dia}
                                eventoDelDia={eventoDelDia}
                                esHoy={esHoy}
                                esSeleccionado={esSeleccionado}
                                alSeleccionar={handleSeleccionarDia}
                            />
                        );
                    })}
                </div>
            </div>

            {modalAbierto && (
                <ModalGestionEvento onClose={() => setModalAbierto(false)} modo={modoModal} fechaPredefinida={fechaSeleccionada} eventoExistente={eventoSeleccionado} onActualizado={cargarEventos} />
            )}
        </div>
    );
}