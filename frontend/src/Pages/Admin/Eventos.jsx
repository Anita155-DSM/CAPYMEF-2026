import { useState, useEffect } from "react";
import { FaPlus, FaEdit } from "react-icons/fa";
import dayjs from "dayjs";
import "dayjs/locale/es";
import ModalGestionEvento from "./Components/Modals/ModalGestionEvento.jsx";
import { obtenerTodosLosEventos } from "../../services/adminServices.js"; // Importamos el servicio

dayjs.locale("es");

export default function EventosAdmin() {
    const [fechaVisible, setFechaVisible] = useState(dayjs());
    const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
    const [eventoSeleccionado, setEventoSeleccionado] = useState(null); // Nuevo estado para el evento clickeado
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modoModal, setModoModal] = useState("crear");

    // Estado para guardar los eventos traídos del backend
    const [eventos, setEventos] = useState([]);

    // Cargar eventos al montar el componente
    const cargarEventos = async () => {
        const result = await obtenerTodosLosEventos();
        if (result.exito) {
            setEventos(result.data);
        }
    };

    useEffect(() => {
        cargarEventos();
    }, []);

    const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const totalDiasMes = fechaVisible.daysInMonth();
    const primerDiaDelMes = fechaVisible.startOf("month").day();
    const espaciosVacios = (primerDiaDelMes + 6) % 7;

    const celdasCalendario = [
        ...Array(espaciosVacios).fill(null),
        ...Array.from({ length: totalDiasMes }, (_, i) => i + 1)
    ];

    const hoy = dayjs();

    // Manejador de clics: ahora también busca si hay un evento en esa fecha
    const handleSeleccionarDia = (dia, eventoDelDia) => {
        if (!dia) return;
        const fechaExacta = fechaVisible.date(dia);

        if (fechaSeleccionada && fechaSeleccionada.isSame(fechaExacta, 'day')) {
            setFechaSeleccionada(null);
            setEventoSeleccionado(null);
        } else {
            setFechaSeleccionada(fechaExacta);
            setEventoSeleccionado(eventoDelDia || null);
        }
    };

    const abrirModalCrear = () => {
        setModoModal("crear");
        setModalAbierto(true);
    };

    const abrirModalEditar = () => {
        setModoModal("editar");
        setModalAbierto(true);
    };

    return (
        <div className="p-8 w-full font-sans bg-[#F4F7F9] min-h-screen relative">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-semibold text-[#132A46] uppercase tracking-wide">
                    Gestión de Eventos y Capacitaciones
                </h1>

                <div className="flex gap-3">
                    {/* El botón de editar AHORA SOLO aparece si hay un evento en la fecha seleccionada */}
                    {fechaSeleccionada && eventoSeleccionado && (
                        <button
                            onClick={abrirModalEditar}
                            className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold py-2.5 px-5 rounded shadow transition-all animacion-modal"
                        >
                            <FaEdit /> Editar Evento
                        </button>
                    )}

                    <button
                        onClick={abrirModalCrear}
                        className="flex items-center gap-2 bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold py-2.5 px-5 rounded shadow transition-colors"
                    >
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
                    {diasSemana.map((dia) => (
                        <div key={dia} className="font-bold text-[#1D7BB6] text-sm">{dia}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-8 gap-x-4 text-center border-b-2 border-[#1D7BB6] pb-12">
                    {celdasCalendario.map((dia, index) => {
                        const esHoy = dia === hoy.date() && fechaVisible.isSame(hoy, 'month');
                        const esSeleccionado = dia && fechaSeleccionada && fechaSeleccionada.date() === dia && fechaVisible.isSame(fechaSeleccionada, 'month');

                        // Búsqueda blindada contra desfasajes horarios
                       const eventoDelDia = dia ? eventos.find(evt => {
                                    if (!evt.fecha) return false;
                                    
                                    // 1. Extraemos solo la parte de la fecha (YYYY-MM-DD) sin importar las horas ni UTC
                                    const fechaEvtStr = evt.fecha.split('T')[0]; 
                                    
                                    // 2. Armamos el string exacto de la celda actual del calendario
                                    const fechaCeldaStr = fechaVisible.date(dia).format("YYYY-MM-DD");
                                    
                                    // 3. Comparamos los strings directamente (cero problemas de zona horaria)
                                    return fechaEvtStr === fechaCeldaStr;
                                }) : null;

                        let clasesColor = "text-[#132A46] bg-white border border-gray-200 hover:bg-gray-100";

                       if (eventoDelDia) {
                            const estadoEvento = eventoDelDia.estado ? eventoDelDia.estado.toLowerCase().trim() : "";

                            if (estadoEvento === "cancelado") {
                                clasesColor = "bg-gray-400 text-white shadow-md";
                            } else if (esHoy) {
                                clasesColor = "bg-green-500 text-white shadow-md"; 
                            } else if (estadoEvento === "programado") {
                                clasesColor = "bg-yellow-400 text-white shadow-md";
                            } else if (estadoEvento === "finalizado") {
                                clasesColor = "bg-red-500 text-white shadow-md";
                            }
                        } else if (esHoy) {
                            clasesColor = "bg-[#1D7BB6] text-white shadow-md";
                        }

                        return (
                            <div key={index} className="flex flex-col justify-start items-center relative">
                                {dia ? (
                                    <>
                                        <div
                                            onClick={() => handleSeleccionarDia(dia, eventoDelDia)}
                                            className={`w-10 h-10 flex items-center justify-center text-sm font-medium rounded-full cursor-pointer transition-all transform hover:scale-110 ${clasesColor} shrink-0`}
                                            title={eventoDelDia ? `${eventoDelDia.titulo} (${eventoDelDia.estado})` : "Día libre"}
                                        >
                                            {dia}
                                        </div>

                                        {eventoDelDia && (
                                            <span
                                                className="absolute top-11 text-[11px] leading-tight font-semibold text-gray-700 w-[120%] truncate px-1 pointer-events-none"
                                                title={eventoDelDia.titulo}
                                            >
                                                {eventoDelDia.titulo}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-10 h-10"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {modalAbierto && (
                <ModalGestionEvento
                    onClose={() => setModalAbierto(false)}
                    modo={modoModal}
                    fechaPredefinida={fechaSeleccionada}
                    eventoExistente={eventoSeleccionado} // Le pasamos el evento completo si es que vamos a editar
                    onActualizado={cargarEventos} // Recarga el calendario tras guardar
                />
            )}
        </div>
    );
}