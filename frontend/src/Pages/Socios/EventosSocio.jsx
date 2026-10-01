import { useEffect, useMemo, useState } from "react";
import { FaCalendarCheck, FaChevronLeft, FaChevronRight, FaClock, FaDownload, FaLocationDot, FaUsers, FaXmark } from "react-icons/fa6";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import "dayjs/locale/es";
import { toast } from "sonner";
import { cambiarInscripcionEvento, descargarCertificadoEvento, obtenerEventosSocio } from "../../services/socioServices";

// Configuración de dayjs
dayjs.extend(isSameOrAfter);
dayjs.locale("es");

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// Solo mostramos como link un lugar que sea https (ej. reunión virtual). Nunca "javascript:" ni similares.
const linkReunion = (evento) => {
    if (evento.modalidad !== "virtual" || !evento.lugar) return null;
    try {
        const url = new URL(evento.lugar);
        return url.protocol === "https:" ? url.href : null;
    } catch {
        return null;
    }
};

export default function EventosSocio() {
    // Usamos dayjs nativamente para el estado del calendario
    const [hoy] = useState(() => dayjs());
    const [mesVisible, setMesVisible] = useState(() => dayjs().startOf("month"));

    const [eventos, setEventos] = useState([]);
    const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [procesando, setProcesando] = useState(false);

    useEffect(() => {
        const cargarEventos = async () => {
            try {
                const evts = await obtenerEventosSocio();
                setEventos(evts);

                // Centrar calendario en el primer evento futuro
                const primerFuturo = evts
                    .filter(e => dayjs(e.fecha).isSameOrAfter(hoy, "day"))
                    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))[0];
                if (primerFuturo) setMesVisible(dayjs(primerFuturo.fecha).startOf("month"));
            } catch (err) {
                setError(err.message);
            } finally {
                setCargando(false);
            }
        };
        cargarEventos();
    }, [hoy]);

    // 1. Encontrar próximo evento con dayjs (Súper reducido)
    const proximoEvento = useMemo(() => {
        const futuros = eventos.filter(e => dayjs(e.fecha).isSameOrAfter(hoy, "day"));
        return futuros.sort((a, b) => dayjs(`${a.fecha}T${a.horaInicio || "00:00"}`).diff(dayjs(`${b.fecha}T${b.horaInicio || "00:00"}`)))[0] || null;
    }, [eventos, hoy]);

    // 2. Calcular grilla con dayjs (Adiós a Date manual)
    const celdasCalendario = useMemo(() => {
        const espaciosVacios = (mesVisible.day() + 6) % 7;
        return [
            ...Array(espaciosVacios).fill(null),
            ...Array.from({ length: mesVisible.daysInMonth() }, (_, i) => i + 1)
        ];
    }, [mesVisible]);

    const eventosDelDia = (dia) => {
        if (!dia) return [];
        const fechaExacta = mesVisible.date(dia).format("YYYY-MM-DD");
        return eventos.filter(e => e.fecha && e.fecha.split('T')[0] === fechaExacta);
    };

    const otrosEventosMismoDia = eventoSeleccionado
        ? eventos.filter(e => e.fecha === eventoSeleccionado.fecha && e.id !== eventoSeleccionado.id)
        : [];

    const gestionarInscripcion = async () => {
        if (!eventoSeleccionado || procesando) return;
        setProcesando(true);
        const inscribirse = !eventoSeleccionado.yaInscripto;
        try {
            const resultado = await cambiarInscripcionEvento(eventoSeleccionado.id, inscribirse);
            setEventos(act => act.map(e => e.id === eventoSeleccionado.id ? { ...e, yaInscripto: inscribirse } : e));
            setEventoSeleccionado(act => ({ ...act, yaInscripto: inscribirse }));
            toast.success(resultado?.mensaje || (inscribirse ? "Inscripción registrada." : "Inscripción cancelada."));
        } catch (err) {
            toast.error(err.message);
        } finally {
            setProcesando(false);
        }
    };

    const descargarCertificado = async () => {
        if (!eventoSeleccionado || procesando) return;
        setProcesando(true);
        try {
            await descargarCertificadoEvento(eventoSeleccionado);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setProcesando(false);
        }
    };

    const enlaceReunion = eventoSeleccionado?.yaInscripto ? linkReunion(eventoSeleccionado) : null;
    const finalizado = eventoSeleccionado?.estado === "finalizado";

    return (
        <section className="min-h-[calc(100vh-9rem)] bg-[#edf7fd] px-1 py-2 sm:px-3 sm:py-5">
            <div className="mb-5 flex flex-col lg:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-normal uppercase text-[#073d6f] sm:text-[25px]">Próximos eventos y capacitaciones</h1>
                    <p className="mt-1 text-sm text-[#6b7884]">Elegí un día en el calendario para ver el evento programado para esa fecha.</p>
                </div>

                {proximoEvento && (
                    <button type="button" onClick={() => setEventoSeleccionado(proximoEvento)} className="bg-white border-l-4 border-[#1D7BB6] p-4 shadow-sm w-full lg:w-80 shrink-0 rounded-r text-left hover:bg-[#f7fbfe] transition-colors">
                        <p className="text-[11px] font-bold text-[#1D7BB6] uppercase mb-1 tracking-wider">Próximo evento</p>
                        <p className="font-bold text-[#132A46] truncate" title={proximoEvento.titulo}>{proximoEvento.titulo}</p>
                        <div className="mt-2 text-xs text-gray-600 space-y-1.5 font-medium">
                            <p><FaCalendarCheck className="inline mr-2 text-[#0875b1]" /> {dayjs(proximoEvento.fecha).format("D [de] MMMM, YYYY")}</p>
                            <p><FaClock className="inline mr-2 text-[#0875b1]" /> {proximoEvento.horaInicio || "A confirmar"} {proximoEvento.horaFin ? ` a ${proximoEvento.horaFin}` : ""}</p>
                            <p className="truncate" title={proximoEvento.lugar || proximoEvento.modalidad}><FaLocationDot className="inline mr-2 text-[#0875b1]" /> {proximoEvento.modalidad === "virtual" ? "Virtual" : (proximoEvento.lugar || "Lugar a confirmar")}</p>
                        </div>
                    </button>
                )}
            </div>

            {error && <div className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            {cargando ? <p className="py-12 text-center text-sm text-gray-600">Cargando eventos...</p> : (
                <div className="mx-auto max-w-5xl">
                    <div className="flex items-center justify-between border-b-4 border-[#0875b1] pb-2 text-[#0875b1]">
                        <button type="button" onClick={() => setMesVisible(mesVisible.subtract(1, "month"))} className="p-2 hover:bg-white" aria-label="Mes anterior"><FaChevronLeft /></button>
                        <h2 className="text-2xl uppercase">{mesVisible.format("MMMM")}</h2>
                        <div className="flex items-center gap-4"><span className="text-2xl">{mesVisible.format("YYYY")}</span><button type="button" onClick={() => setMesVisible(mesVisible.add(1, "month"))} className="p-2 hover:bg-white" aria-label="Mes siguiente"><FaChevronRight /></button></div>
                    </div>

                    <div className="grid grid-cols-7 pt-5 text-center text-sm font-bold text-[#0063a7]">
                        {diasSemana.map((dia) => <span key={dia}><span className="hidden sm:inline">{dia}</span><span className="sm:hidden">{dia.slice(0, 2)}</span></span>)}
                    </div>

                    <div className="grid grid-cols-7 border-b-4 border-[#0875b1] pb-7 pt-3">
                        {celdasCalendario.map((dia, indice) => {
                            const evtDia = eventosDelDia(dia);
                            return (
                                <button
                                    type="button"
                                    key={`${dia || "vacio"}-${indice}`}
                                    disabled={!dia || !evtDia.length}
                                    onClick={() => evtDia[0] && setEventoSeleccionado(evtDia[0])}
                                    className={`flex flex-col min-h-[100px] items-center justify-start pt-2 px-1 text-sm ${evtDia.length ? "hover:bg-white/60 transition-colors" : "cursor-default"}`}
                                >
                                    <span className={evtDia.length ? "flex h-8 w-8 items-center justify-center rounded-full bg-[#5aa8d5] font-bold text-white shrink-0" : "flex h-8 items-center text-[#073d6f] shrink-0"}>
                                        {dia || ""}
                                    </span>
                                    {evtDia.length > 0 && (
                                        <span className="mt-1 w-full text-[10px] leading-tight text-[#073d6f] font-medium line-clamp-2" title={evtDia[0].titulo}>
                                            {evtDia[0].titulo}{evtDia.length > 1 ? ` (+${evtDia.length - 1})` : ""}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {!eventos.length && !error && <p className="py-8 text-center text-sm text-gray-600">No hay eventos publicados.</p>}
                </div>
            )}

            {/* Modal de Detalle */}
            {eventoSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A46]/50 px-4" onMouseDown={(e) => e.target === e.currentTarget && setEventoSeleccionado(null)}>
                    <div className="w-full max-w-lg border border-[#d7e0e5] bg-white p-6 shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto" role="dialog" aria-modal="true">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase text-[#1D7BB6]">Evento para socios{finalizado ? " · Finalizado" : ""}</p>
                                <h2 className="mt-1 text-2xl font-bold text-[#132A46]">{eventoSeleccionado.titulo}</h2>
                            </div>
                            <button type="button" onClick={() => setEventoSeleccionado(null)} className="text-xl text-gray-500 hover:text-black" aria-label="Cerrar"><FaXmark /></button>
                        </div>

                        <p className="mt-4 text-sm text-gray-700 max-h-32 overflow-y-auto whitespace-pre-wrap">{eventoSeleccionado.descripcion || "Sin descripción disponible."}</p>

                        <div className="mt-5 space-y-3 border-y border-gray-200 py-4 text-sm text-gray-700">
                            <p><FaCalendarCheck className="mr-2 inline text-[#0875b1]" />{dayjs(eventoSeleccionado.fecha).format("dddd D [de] MMMM, YYYY")}</p>
                            <p><FaClock className="mr-2 inline text-[#0875b1]" />{eventoSeleccionado.horaInicio || "Horario a confirmar"}{eventoSeleccionado.horaFin ? ` a ${eventoSeleccionado.horaFin}` : ""}</p>
                            <p className="break-words">
                                <FaLocationDot className="mr-2 inline text-[#0875b1]" />
                                {enlaceReunion ? (
                                    <a href={enlaceReunion} target="_blank" rel="noopener noreferrer" className="font-bold text-[#0875b1] hover:underline">Unirme a la reunión virtual</a>
                                ) : eventoSeleccionado.modalidad === "virtual" ? (
                                    eventoSeleccionado.yaInscripto ? "Virtual (el enlace se informará por correo)" : "Virtual (el enlace se habilita al inscribirte)"
                                ) : (
                                    eventoSeleccionado.lugar || "Lugar a confirmar"
                                )}
                            </p>
                            <p><FaUsers className="mr-2 inline text-[#0875b1]" />{eventoSeleccionado.cupoMaximo ? `${eventoSeleccionado.cupoMaximo} cupos` : "Cupo abierto"}</p>
                            {eventoSeleccionado.yaInscripto && <p className="font-bold text-[#247c5c]">Ya estás inscripto a este evento.</p>}
                        </div>

                        {otrosEventosMismoDia.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs font-bold uppercase text-[#66727d]">Otros eventos ese día</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {otrosEventosMismoDia.map((evento) => (
                                        <button key={evento.id} type="button" onClick={() => setEventoSeleccionado(evento)} className="border border-[#d7e0e5] bg-[#f4f9fc] px-2 py-1 text-xs text-[#17384f] hover:bg-[#e7f2f8]">{evento.titulo}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-5 flex flex-wrap justify-end gap-3">
                            <button type="button" onClick={() => setEventoSeleccionado(null)} className="border border-gray-300 px-4 py-2 text-sm">Cerrar</button>
                            {finalizado ? (
                                eventoSeleccionado.yaInscripto && (
                                    <button type="button" disabled={procesando} onClick={descargarCertificado} className="inline-flex items-center gap-2 bg-[#1b527d] px-4 py-2 text-sm font-bold text-white hover:bg-[#164568] disabled:opacity-60 transition-colors">
                                        {procesando ? "Descargando..." : "Descargar certificado"} <FaDownload />
                                    </button>
                                )
                            ) : (
                                <button type="button" disabled={procesando} onClick={gestionarInscripcion} className="bg-[#1b527d] px-4 py-2 text-sm font-bold text-white hover:bg-[#164568] disabled:opacity-60 transition-colors">
                                    {procesando ? "Procesando..." : eventoSeleccionado.yaInscripto ? "Cancelar inscripción" : "Inscribirme"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
