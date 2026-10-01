import { useEffect, useMemo, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { FaArrowRight, FaChartLine, FaChevronRight } from "react-icons/fa6";
import { obtenerNoticiasSocios } from "../../services/noticiasService";
import {
    ESTILOS_ESTADO_CUOTA,
    elegirCuotaActual,
    formatearPeriodo,
    obtenerEventosSocio,
} from "../../services/socioServices";
import TarjetaCuota, { AvisoCuotasNoDisponibles } from "./Components/TarjetaCuota";

const fechaHoraEvento = (evento) => new Date(`${evento.fecha}T${evento.horaInicio || "00:00"}`);

export default function InicioSocio() {
    const { usuario, cuotas, errorCuotas } = useOutletContext(); // Recibimos el usuario y sus cuotas desde el Layout
    const [proximoEvento, setProximoEvento] = useState(null);
    const [ultimasNoticias, setUltimasNoticias] = useState([]);

    useEffect(() => {
        const cargarResumen = async () => {
            const ahora = new Date();
            const [resultadoEventos, resultadoNoticias] = await Promise.allSettled([
                obtenerEventosSocio(),
                obtenerNoticiasSocios(),
            ]);

            if (resultadoEventos.status === "fulfilled") {
                const eventosFuturos = resultadoEventos.value
                    .filter((evento) => evento.fecha && fechaHoraEvento(evento) >= ahora)
                    .sort((a, b) => fechaHoraEvento(a) - fechaHoraEvento(b));
                setProximoEvento(eventosFuturos[0] || null);
            }

            if (resultadoNoticias.status === "fulfilled" && resultadoNoticias.value?.exito) {
                setUltimasNoticias((resultadoNoticias.value.data || []).slice(0, 3));
            }
        };

        cargarResumen();
    }, []);

    const cuotaActual = useMemo(() => (Array.isArray(cuotas) ? elegirCuotaActual(cuotas) : null), [cuotas]);
    const movimientos = useMemo(
        () => (Array.isArray(cuotas) ? [...cuotas].sort((a, b) => String(b.mes_anio).localeCompare(String(a.mes_anio))).slice(0, 3) : []),
        [cuotas]
    );
    const cuotasImpagas = Array.isArray(cuotas) ? cuotas.filter((cuota) => cuota.estado !== "pagada") : [];

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
                {Array.isArray(cuotas) && !errorCuotas && (
                    cuotasImpagas.length === 0 ? (
                        <span className="w-fit rounded-sm bg-[#00bf68] px-4 py-2 text-sm font-bold text-white">Estás al día!</span>
                    ) : (
                        <Link to="/socios/pagos" className="w-fit rounded-sm bg-[#e66d4a] px-4 py-2 text-sm font-bold text-white hover:bg-[#cf5b39]">
                            {cuotasImpagas.length === 1 ? "Tenés 1 cuota por pagar" : `Tenés ${cuotasImpagas.length} cuotas por pagar`}
                        </Link>
                    )
                )}
            </section>

            <TarjetaCuota cuota={cuotaActual} cuotas={cuotas} errorCuotas={errorCuotas} />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
                <div className="space-y-6">
                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
                            <h2 className="text-lg font-medium uppercase text-gray-600">Estado de la cuenta</h2>
                            <Link to="/socios/pagos" className="text-sm font-bold text-[#0875b1] hover:underline">Ver historial</Link>
                        </div>
                        <div className="space-y-1">
                            {cuotas === undefined ? (
                                <p className="text-sm text-gray-600">Cargando movimientos...</p>
                            ) : cuotas === null ? (
                                <AvisoCuotasNoDisponibles />
                            ) : movimientos.length === 0 ? (
                                <p className="text-sm text-gray-600">Todavía no hay movimientos en tu cuenta.</p>
                            ) : movimientos.map((movimiento) => {
                                const estilo = ESTILOS_ESTADO_CUOTA[movimiento.estado] || ESTILOS_ESTADO_CUOTA.pendiente;
                                return (
                                    <div key={movimiento.id} className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
                                        <span className="text-sm first-letter:uppercase sm:text-base">Cuota de {formatearPeriodo(movimiento.mes_anio)}</span>
                                        <span className={`min-w-20 px-2 py-1 text-center text-sm ${estilo.clase}`}>{estilo.texto}</span>
                                    </div>
                                );
                            })}
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
                                <div><h3 className="font-bold">{proximoEvento.titulo}</h3><p className="text-sm text-gray-600">◉ {proximoEvento.lugar || proximoEvento.modalidad || "Lugar a confirmar"}</p><p className="text-sm text-gray-600">♟ {proximoEvento.cupoMaximo ? `${proximoEvento.cupoMaximo} cupos` : "Cupo abierto"}</p></div>
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
