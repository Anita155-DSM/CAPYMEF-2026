import { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { FaArrowRight, FaChartLine, FaChevronRight, FaCreditCard, FaDownload } from "react-icons/fa6";
import { obtenerNoticiasSocios } from "../../services/noticiasService";

const movimientos = [
    { periodo: "Septiembre de 2026", estado: "Pendiente", tipo: "pendiente" },
    { periodo: "Agosto de 2026", estado: "Pagada", tipo: "pagada" },
    { periodo: "Julio de 2026", estado: "Pagada", tipo: "pagada" },
];

export default function InicioSocio() {
    const { usuario } = useOutletContext(); // Recibimos el usuario desde el Layout
    const [proximoEvento, setProximoEvento] = useState(null);
    const [ultimasNoticias, setUltimasNoticias] = useState([]);

    useEffect(() => {
        const cargarResumen = async () => {
            const token = localStorage.getItem("token");
            const ahora = new Date();

            try {
                const [respuestaEventos, respuestaNoticias] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/eventos/socios`, { headers: { Authorization: `Bearer ${token}` } }),
                    obtenerNoticiasSocios(),
                ]);
                const resultadoEventos = await respuestaEventos.json();

                if (respuestaEventos.ok && resultadoEventos.exito) {
                    const eventosFuturos = (resultadoEventos.data || [])
                        .filter((evento) => evento.estado !== "cancelado" && evento.fecha)
                        .filter((evento) => new Date(`${evento.fecha}T${evento.horaInicio || "00:00"}`) >= ahora)
                        .sort((a, b) => new Date(`${a.fecha}T${a.horaInicio || "00:00"}`) - new Date(`${b.fecha}T${b.horaInicio || "00:00"}`));
                    setProximoEvento(eventosFuturos[0] || null);
                }

                if (respuestaNoticias.exito) {
                    setUltimasNoticias((respuestaNoticias.data || []).slice(0, 3));
                }
            } catch (error) {
                console.error("No se pudo cargar el resumen del socio:", error);
            }
        };

        cargarResumen();
    }, []);

    const nombreEmpresa = usuario.razonSocial || "Tu empresa";
    const rubro = usuario.rubro || "Rubro no informado";
    const localidad = usuario.localidad || "Localidad no informada";

    return (
        <div className="space-y-6">
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <p className="mb-1 text-sm font-semibold text-[#1D7BB6]">PANEL DE SOCIO</p>
                    <h1 className="text-2xl font-bold uppercase tracking-tight text-[#132A46] sm:text-3xl">Hola, {nombreEmpresa}</h1>
                    <p className="mt-2 text-sm text-gray-600">Socio N° {usuario.id || "-"} <span className="mx-2">•</span> {rubro} <span className="mx-2">•</span> {localidad}</p>
                </div>
                <span className="w-fit rounded-sm bg-[#00bf68] px-4 py-2 text-sm font-bold text-white">Estás al día!</span>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm font-medium uppercase text-gray-600">Cuota de septiembre de 2026</p>
                        <p className="mt-1 text-4xl font-bold text-[#151515]">$ 5.000</p>
                        <span className="mt-2 inline-flex rounded-full bg-gray-300 px-3 py-1 text-xs font-semibold text-gray-600">Vence el 10/09 ◷</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button className="inline-flex items-center gap-2 border border-gray-300 bg-[#f5f9fc] px-3 py-2 text-sm font-medium hover:bg-gray-100">Descargar comprobante <FaDownload /></button>
                        <button className="inline-flex items-center gap-2 bg-[#2693bf] px-4 py-2 text-sm font-bold text-white hover:bg-[#1b789f]">Pagar cuota <FaCreditCard /></button>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
                <div className="space-y-6">
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
                            <h2 className="text-lg font-medium uppercase text-gray-600">Estado de la cuenta</h2>
                            <button className="text-sm font-bold text-[#0875b1] hover:underline">Ver historial</button>
                        </div>
                        <div className="space-y-1">
                            {movimientos.map((movimiento) => (
                                <div key={movimiento.periodo} className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
                                    <span className="text-sm sm:text-base">Cuota de {movimiento.periodo}</span>
                                    <span className={`min-w-20 px-2 py-1 text-center text-sm ${movimiento.tipo === "pagada" ? "bg-[#61d5a5] text-[#247c5c]" : "bg-[#ffd58f] text-[#a16b18]"}`}>{movimiento.estado}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-medium uppercase text-gray-600">Próximo evento</h2>
                            <Link to="/socios/eventos" className="flex items-center gap-2 text-sm font-bold text-[#0875b1] hover:underline">Ver todos <FaArrowRight /></Link>
                        </div>
                        {proximoEvento ? (
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-[#168bc4] px-3 py-2 text-center font-bold text-white"><span className="block text-xs">{new Date(`${proximoEvento.fecha}T00:00:00`).toLocaleDateString("es-AR", { month: "short" }).replace(".", "").toUpperCase()}</span><span className="text-xl">{new Date(`${proximoEvento.fecha}T00:00:00`).getDate()}</span></div>
                                <div><h3 className="font-bold">{proximoEvento.titulo}</h3><p className="text-sm text-gray-600">◉ {proximoEvento.lugar || proximoEvento.modalidad || "Lugar a confirmar"}</p><p className="text-sm text-gray-600">♟ {proximoEvento.cupoMaximo ? `${proximoEvento.cupoMaximo} cupos disponibles` : "Cupo abierto"}</p></div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">No hay próximos eventos publicados.</p>
                        )}
                    </section>
                </div>

                <section className="border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
                        <h2 className="text-lg font-medium uppercase text-gray-600">Novedades</h2>
                        <FaChartLine className="text-[#1D7BB6]" />
                    </div>
                    <div className="divide-y divide-gray-200">
                        {ultimasNoticias.length ? ultimasNoticias.map((noticia) => (
                            <article key={noticia.id} className="py-3 first:pt-0">
                                <p className="mb-1 text-sm font-medium">{new Date(noticia.fechaPublicacion).toLocaleDateString("es-AR")}</p>
                                <p className="text-sm leading-snug text-gray-800">{noticia.titulo}</p>
                            </article>
                        )) : (
                            <p className="py-3 text-sm text-gray-600">No hay noticias publicadas.</p>
                        )}
                    </div>
                    <Link to="/socios/noticias" className="mt-5 flex items-center gap-2 text-sm font-bold text-[#0875b1] hover:underline">Ver todas las noticias <FaChevronRight /></Link>
                </section>
            </div>
        </div>
    );
}