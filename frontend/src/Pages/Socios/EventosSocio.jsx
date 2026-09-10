import { useEffect, useMemo, useState } from "react";
import { FaCalendarCheck, FaChevronLeft, FaChevronRight, FaClock, FaLocationDot, FaUsers, FaXmark } from "react-icons/fa6";

const API_URL = import.meta.env.VITE_API_URL;
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const fechaEvento = (evento) => new Date(`${evento.fecha}T00:00:00`);

const formatearFecha = (fecha) => fecha.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

export default function EventosSocio() {
    const hoy = new Date();
    const [mes, setMes] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    const [eventos, setEventos] = useState([]);
    const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [procesando, setProcesando] = useState(false);

    useEffect(() => {
        const cargarEventos = async () => {
            try {
                const token = localStorage.getItem("token");
                const respuesta = await fetch(`${API_URL}/eventos/socios`, { headers: { Authorization: `Bearer ${token}` } });
                const resultado = await respuesta.json();
                if (!respuesta.ok || !resultado.exito) throw new Error(resultado.mensaje || "No se pudieron cargar los eventos");

                let eventosPublicados = (resultado.data || []).filter((evento) => evento.estado !== "cancelado");
                if (!eventosPublicados.length) {
                    const respuestaPublica = await fetch(`${API_URL}/eventos/publicos`);
                    const resultadoPublico = await respuestaPublica.json();
                    if (respuestaPublica.ok && resultadoPublico.exito) {
                        eventosPublicados = (resultadoPublico.data || []).filter((evento) => evento.estado !== "cancelado");
                    }
                }

                setEventos(eventosPublicados);
                if (eventosPublicados.length && eventosPublicados[0].fecha) {
                    const primeraFecha = fechaEvento(eventosPublicados[0]);
                    setMes(new Date(primeraFecha.getFullYear(), primeraFecha.getMonth(), 1));
                }
            } catch (errorCarga) {
                setError(errorCarga.message);
            } finally {
                setCargando(false);
            }
        };
        cargarEventos();
    }, []);

    const diasDelMes = useMemo(() => {
        const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1);
        const desplazamiento = (inicio.getDay() + 6) % 7;
        const cantidad = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
        return [...Array(desplazamiento).fill(null), ...Array.from({ length: cantidad }, (_, indice) => indice + 1)];
    }, [mes]);

    const eventosDelDia = (dia) => eventos.filter((evento) => {
        const fecha = fechaEvento(evento);
        return dia && fecha.getFullYear() === mes.getFullYear() && fecha.getMonth() === mes.getMonth() && fecha.getDate() === dia;
    });

    const cambiarMes = (cantidad) => setMes((actual) => new Date(actual.getFullYear(), actual.getMonth() + cantidad, 1));

    const gestionarInscripcion = async () => {
        if (!eventoSeleccionado) return;
        setProcesando(true);
        try {
            const token = localStorage.getItem("token");
            const metodo = eventoSeleccionado.yaInscripto ? "DELETE" : "POST";
            const respuesta = await fetch(`${API_URL}/eventos/${eventoSeleccionado.id}/inscribirse`, { method: metodo, headers: { Authorization: `Bearer ${token}` } });
            const resultado = await respuesta.json();
            if (!respuesta.ok || !resultado.exito) throw new Error(resultado.mensaje || "No se pudo actualizar la inscripción");
            setEventos((actuales) => actuales.map((evento) => evento.id === eventoSeleccionado.id ? { ...evento, yaInscripto: !evento.yaInscripto } : evento));
            setEventoSeleccionado((actual) => ({ ...actual, yaInscripto: !actual.yaInscripto }));
        } catch (errorInscripcion) {
            setError(errorInscripcion.message);
        } finally {
            setProcesando(false);
        }
    };

    return (
        <section className="min-h-[calc(100vh-9rem)] bg-[#edf7fd] px-1 py-2 sm:px-3 sm:py-5">
            <div className="mb-5">
                <h1 className="text-2xl font-normal uppercase text-[#073d6f] sm:text-[25px]">Próximos eventos y capacitaciones</h1>
                <p className="mt-1 text-sm text-[#6b7884]">Elegí un día en el calendario para ver el evento programado para esa fecha.</p>
            </div>

            {error && <div className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            {cargando ? <p className="py-12 text-center text-sm text-gray-600">Cargando eventos...</p> : (
                <div className="mx-auto max-w-4xl">
                    <div className="flex items-center justify-between border-b-4 border-[#0875b1] pb-2 text-[#0875b1]">
                        <button type="button" onClick={() => cambiarMes(-1)} className="p-2 hover:bg-white" aria-label="Mes anterior"><FaChevronLeft /></button>
                        <h2 className="text-2xl uppercase">{meses[mes.getMonth()]}</h2>
                        <div className="flex items-center gap-4"><span className="text-2xl">{mes.getFullYear()}</span><button type="button" onClick={() => cambiarMes(1)} className="p-2 hover:bg-white" aria-label="Mes siguiente"><FaChevronRight /></button></div>
                    </div>
                    <div className="grid grid-cols-7 pt-5 text-center text-sm font-bold text-[#0063a7]">{diasSemana.map((dia) => <span key={dia}>{dia}</span>)}</div>
                    <div className="grid grid-cols-7 border-b-4 border-[#0875b1] pb-7 pt-3">
                        {diasDelMes.map((dia, indice) => {
                            const eventosDia = eventosDelDia(dia);
                            return <button type="button" key={`${dia || "vacio"}-${indice}`} disabled={!dia} onClick={() => eventosDia[0] && setEventoSeleccionado(eventosDia[0])} className={`flex min-h-16 items-center justify-center text-sm ${dia ? "hover:bg-white" : "cursor-default"}`}>
                                <span className={eventosDia.length ? "flex h-8 w-8 items-center justify-center rounded-full bg-[#5aa8d5] font-bold text-white" : "text-[#073d6f]"}>{dia || ""}</span>
                            </button>;
                        })}
                    </div>
                    {!eventos.length && <p className="py-8 text-center text-sm text-gray-600">No hay eventos publicados.</p>}
                </div>
            )}

            {eventoSeleccionado && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A46]/50 px-4" onMouseDown={(evento) => evento.target === evento.currentTarget && setEventoSeleccionado(null)}>
                <div className="w-full max-w-lg border border-[#d7e0e5] bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="titulo-evento">
                    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase text-[#1D7BB6]">Evento para socios</p><h2 id="titulo-evento" className="mt-1 text-2xl font-bold text-[#132A46]">{eventoSeleccionado.titulo}</h2></div><button type="button" onClick={() => setEventoSeleccionado(null)} className="text-xl text-gray-500" aria-label="Cerrar"><FaXmark /></button></div>
                    <p className="mt-4 text-sm text-gray-700">{eventoSeleccionado.descripcion || "Sin descripción disponible."}</p>
                    <div className="mt-5 space-y-3 border-y border-gray-200 py-4 text-sm text-gray-700"><p><FaCalendarCheck className="mr-2 inline text-[#0875b1]" />{formatearFecha(fechaEvento(eventoSeleccionado))}</p><p><FaClock className="mr-2 inline text-[#0875b1]" />{eventoSeleccionado.horaInicio || "Horario a confirmar"}{eventoSeleccionado.horaFin ? ` a ${eventoSeleccionado.horaFin}` : ""}</p><p><FaLocationDot className="mr-2 inline text-[#0875b1]" />{eventoSeleccionado.lugar || eventoSeleccionado.modalidad || "Lugar a confirmar"}</p><p><FaUsers className="mr-2 inline text-[#0875b1]" />{eventoSeleccionado.cupoMaximo ? `${eventoSeleccionado.cupoMaximo} cupos` : "Cupo abierto"}</p></div>
                    <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setEventoSeleccionado(null)} className="border border-gray-300 px-4 py-2 text-sm">Cerrar</button><button type="button" disabled={procesando} onClick={gestionarInscripcion} className="bg-[#1b527d] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{procesando ? "Procesando..." : eventoSeleccionado.yaInscripto ? "Cancelar inscripción" : "Inscribirme"}</button></div>
                </div>
            </div>}
        </section>
    );
}
