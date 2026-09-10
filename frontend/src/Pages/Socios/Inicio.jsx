import { useEffect, useState } from "react";
import {
    FaArrowRight,
    FaBell,
    FaBuilding,
    FaChartBar,
    FaCalendarCheck,
    FaChartLine,
    FaChevronRight,
    FaCircleUser,
    FaCreditCard,
    FaDownload,
    FaGear,
    FaHouse,
    FaIdCard,
    FaLocationDot,
    FaPhone,
    FaEnvelope,
    FaUsers,
    FaGears,
    FaMoneyBillWave,
    FaNewspaper,
    FaBars,
    FaXmark,
} from "react-icons/fa6";
import { Link } from "react-router-dom";
import logo from "../../assets/img/Logo.png";
import { obtenerPerfil } from "../../services/authServices";
import EventosSocio from "./EventosSocio";
import NoticiasSocio from "./NoticiasSocio";

function App() {
    return (
        <div className="flex h-full w-full items-center justify-start overflow-hidden">
            <img src={logo} alt="CAPYMEF" className="max-h-16 w-30 object-contain" />
        </div>
    );
}   

const movimientos = [
    { periodo: "Septiembre de 2026", estado: "Pendiente", tipo: "pendiente" },
    { periodo: "Agosto de 2026", estado: "Pagada", tipo: "pagada" },
    { periodo: "Julio de 2026", estado: "Pagada", tipo: "pagada" },
];

const novedades = [
    { fecha: "20/08/2026", texto: "Nuevo convenio con CAME para créditos a tasa subsidiada" },
    { fecha: "14/08/2026", texto: "Actualización del valor de la cuota societaria" },
    { fecha: "05/08/2026", texto: "Convocatoria a asamblea ordinaria de socios" },
];

export default function Socios() {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [seccionActiva, setSeccionActiva] = useState("Inicio");
    const [solicitudAbierta, setSolicitudAbierta] = useState(null);
    const [detalleSolicitud, setDetalleSolicitud] = useState("");
    const [solicitudEnviada, setSolicitudEnviada] = useState(false);
    const [usuario, setUsuario] = useState(() => {
        const usuarioGuardado = localStorage.getItem("usuario");
        return usuarioGuardado ? JSON.parse(usuarioGuardado) : {};
    });

    useEffect(() => {
        const cargarPerfil = async () => {
            try {
                const resultado = await obtenerPerfil();
                if (resultado.exito) {
                    setUsuario(resultado.data);
                    localStorage.setItem("usuario", JSON.stringify(resultado.data));
                }
            } catch (error) {
                console.error("No se pudo cargar el perfil del socio:", error);
            }
        };

        cargarPerfil();
    }, []);

    const nombreEmpresa = usuario.razonSocial || "Tu empresa";
    const categoria = usuario.categoria ? usuario.categoria.replace(/^./, (letra) => letra.toUpperCase()) : "Socio";
    const rubro = usuario.rubro || "Rubro no informado";
    const localidad = usuario.localidad || "Localidad no informada";
    const actividad = usuario.actividad || "Actividad no informada";
    const tamanoEmpresa = usuario.tamano_empresa === "Pequena" ? "Pequeña" : (usuario.tamano_empresa || "Tamaño no informado");

    const menu = [
        { nombre: "Inicio", icono: FaHouse },
        { nombre: "Mi empresa", icono: FaBuilding },
        { nombre: "Pagos", icono: FaMoneyBillWave },
        { nombre: "Eventos", icono: FaCalendarCheck },
        { nombre: "Noticias", icono: FaNewspaper },
    ];

    const cambiarSeccion = (nombre) => {
        setSeccionActiva(nombre);
        setMenuAbierto(false);
    };

    const abrirSolicitud = (tipo) => {
        setSolicitudAbierta(tipo);
        setDetalleSolicitud("");
        setSolicitudEnviada(false);
    };

    const cerrarSolicitud = () => {
        setSolicitudAbierta(null);
        setDetalleSolicitud("");
        setSolicitudEnviada(false);
    };

    const enviarSolicitud = (evento) => {
        evento.preventDefault();
        if (detalleSolicitud.trim()) {
            setSolicitudEnviada(true);
        }
    };

    return (
        <div className="min-h-screen bg-[#eef6fb] text-[#132A46] font-sans">
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#1b527d] text-white transition-transform duration-300 lg:translate-x-0 ${menuAbierto ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex h-20 items-center justify-between border-b border-white/10 px-3">
                    <App />
                    <button className="lg:hidden text-2xl" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú">
                        <FaXmark />
                    </button>
                </div>
                <nav className="space-y-2 px-3 py-7">
                    {menu.map(({ nombre, icono: Icono }) => (
                        <button key={nombre} onClick={() => cambiarSeccion(nombre)} className={`flex w-full items-center gap-4 border-l-4 px-4 py-3 text-left text-sm font-bold transition-colors ${seccionActiva === nombre ? "border-[#38a4df] bg-white/20" : "border-transparent hover:bg-white/10"}`}>
                            <Icono className="w-6 text-lg" />
                            {nombre}
                        </button>
                    ))}
                </nav>
                <button className="absolute bottom-7 left-7 flex items-center gap-4 text-sm font-bold text-white/90 hover:text-white" onClick={() => cambiarSeccion("Configuración")}>
                    <FaGear className="text-xl" /> Configuración
                </button>
            </aside>

            {menuAbierto && <button className="fixed inset-0 z-30 bg-[#132A46]/50 lg:hidden" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú" />}

            <div className="lg:pl-64">
                <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-5 shadow-sm sm:px-8">
                    <button className="text-2xl text-[#1b527d] lg:hidden" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
                        <FaBars />
                    </button>
                    <div className="hidden text-sm text-gray-500 sm:block"></div>
                    <div className="ml-auto flex items-center gap-4 sm:gap-6">
                        <button className="relative text-xl text-[#1D7BB6]" aria-label="Notificaciones">
                            <FaBell />
                            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#e66d4a]" />
                        </button>
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-bold text-[#132A46]">{nombreEmpresa}</p>
                            <p className="text-xs text-gray-500">{categoria}</p>
                        </div>
                        <FaCircleUser className="text-4xl text-[#1D7BB6]" />
                    </div>
                </header>

                <main className="mx-auto max-w-[1400px] p-5 sm:p-8">
                    {seccionActiva !== "Mi empresa" && seccionActiva !== "Eventos" && seccionActiva !== "Noticias" && <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <p className="mb-1 text-sm font-semibold text-[#1D7BB6]">PANEL DE SOCIO</p>
                            <h1 className="text-2xl font-bold uppercase tracking-tight text-[#132A46] sm:text-3xl">Hola, {nombreEmpresa}</h1>
                            <p className="mt-2 text-sm text-gray-600">Socio N° {usuario.id || "-"} <span className="mx-2">•</span> {rubro} <span className="mx-2">•</span> {localidad}</p>
                        </div>
                        <span className="w-fit rounded-sm bg-[#00bf68] px-4 py-2 text-sm font-bold text-white">Estás al día!</span>
                    </section>}

                    {seccionActiva !== "Mi empresa" && seccionActiva !== "Eventos" && seccionActiva !== "Noticias" && <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
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
                    </section>}

     {/*ACA ESTA LA SECCION DE MI EMPRESA */}               

                    {seccionActiva === "Eventos" ? (
                        <EventosSocio />
                    ) : seccionActiva === "Noticias" ? (
                        <NoticiasSocio />
                    ) : seccionActiva === "Mi empresa" ? (
                        <section className="min-h-[calc(100vh-9rem)] bg-[#edf7fd] px-1 py-2 sm:px-3 sm:py-5">
                            <div className="mb-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                <div>
                                    <h1 className="text-2xl font-normal uppercase text-[#073d6f] sm:text-[25px]">Mi empresa</h1>
                                    <p className="text-sm text-[#6b7884]">Ficha de {nombreEmpresa}</p>
                                </div>
                            </div>

                            <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(400px,1fr)]">
                                <div className="rounded-[25px] border border-[#d9d9d9] bg-white px-3 py-5 sm:px-4 sm:py-5">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <h2 className="text-lg font-bold uppercase text-[#34414c]">Datos institucionales</h2>
                                        <button type="button" onClick={() => abrirSolicitud("Datos institucionales")} className="border border-[#d7e0e5] bg-[#f4f9fc] px-2 py-2 text-sm text-[#17384f] hover:bg-[#e7f2f8]">Solicitar modificación</button>
                                    </div>
                                    <div className="space-y-0">
                                        {[
                                            [FaBuilding, "Empresa", usuario.razonSocial],
                                            [FaIdCard, "CUIT", usuario.cuit],
                                            [FaUsers, "Categoría", categoria],
                                            [FaGears, "Rubro", rubro],
                                            [FaChartLine, "Actividad", actividad],
                                            [FaChartBar, "Tamaño de la empresa", tamanoEmpresa],
                                            [FaLocationDot, "Localidad", localidad],
                                        ].map(([Icono, etiqueta, valor]) => (
                                            <div key={etiqueta} className="grid grid-cols-[30px_1fr] items-end border-b border-[#d8d8d8] py-2 last:border-0">
                                                <Icono className="mb-0.5 text-lg text-[#006ab4]" />
                                                <div>
                                                    <p className="text-base uppercase text-[#66727d]">{etiqueta}</p>
                                                    <p className="text-base text-[#3a4147]">{valor || "No informado"}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border border-[#e0e0e0] bg-white px-3 py-5 sm:px-3">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <h2 className="text-lg font-bold uppercase text-[#34414c]">Contacto</h2>
                                        <button type="button" onClick={() => abrirSolicitud("Contacto")} className="border border-[#d7e0e5] bg-[#f4f9fc] px-2 py-2 text-sm text-[#17384f] hover:bg-[#e7f2f8]">Solicitar modificación</button>
                                    </div>
                                    <div>
                                        {[
                                            [FaPhone, "Teléfono", usuario.telefono],
                                            [FaEnvelope, "Correo electrónico", usuario.email],
                                        ].map(([Icono, etiqueta, valor]) => (
                                            <div key={etiqueta} className="grid grid-cols-[30px_1fr] items-end border-b border-[#d8d8d8] py-2 last:border-0">
                                                <Icono className="mb-0.5 text-base text-[#006ab4]" />
                                                <div>
                                                    <p className="text-base uppercase text-[#66727d]">{etiqueta}</p>
                                                    <p className="text-base text-[#3a4147]">{valor || "No informado"}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    ) : (
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
                                    <button className="flex items-center gap-2 text-sm font-bold text-[#0875b1] hover:underline">Ver todos <FaArrowRight /></button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="rounded-lg bg-[#168bc4] px-3 py-2 text-center font-bold text-white"><span className="block text-xs">SEP</span><span className="text-xl">02</span></div>
                                    <div><h3 className="font-bold">Educación Financiera</h3><p className="text-sm text-gray-600">◉ Sede CAPYMEF</p><p className="text-sm text-gray-600">♟ 20 Cupos disponibles</p></div>
                                </div>
                            </section>
                        </div>

                        <section className="border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3"><h2 className="text-lg font-medium uppercase text-gray-600">Novedades</h2><FaChartLine className="text-[#1D7BB6]" /></div>
                            <div className="divide-y divide-gray-200">
                                {novedades.map((novedad) => <article key={novedad.fecha} className="py-3 first:pt-0"><p className="mb-1 text-sm font-medium">{novedad.fecha}</p><p className="text-sm leading-snug text-gray-800">{novedad.texto}</p></article>)}
                            </div>
                            <button className="mt-5 flex items-center gap-2 text-sm font-bold text-[#0875b1] hover:underline">Ver todas las noticias <FaChevronRight /></button>
                        </section>
                    </div>
                    )}
                </main>
            </div>

            {solicitudAbierta && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A46]/50 px-4" onMouseDown={(evento) => evento.target === evento.currentTarget && cerrarSolicitud()}>
                    <div className="w-full max-w-lg border border-[#d7e0e5] bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="titulo-solicitud">
                        {solicitudEnviada ? (
                            <div className="text-center">
                                <h2 id="titulo-solicitud" className="text-xl font-bold text-[#132A46]">Solicitud registrada</h2>
                                <p className="mt-3 text-sm text-gray-600">Tu pedido de modificación de {solicitudAbierta.toLowerCase()} quedó preparado para ser revisado por CAPYMEF.</p>
                                <button type="button" onClick={cerrarSolicitud} className="mt-6 bg-[#1b527d] px-5 py-2 text-sm font-bold text-white hover:bg-[#164568]">Cerrar</button>
                            </div>
                        ) : (
                            <form onSubmit={enviarSolicitud}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase text-[#1D7BB6]">Mi empresa</p>
                                        <h2 id="titulo-solicitud" className="mt-1 text-xl font-bold text-[#132A46]">Modificar {solicitudAbierta.toLowerCase()}</h2>
                                    </div>
                                    <button type="button" onClick={cerrarSolicitud} className="text-2xl leading-none text-gray-500 hover:text-[#132A46]" aria-label="Cerrar">&times;</button>
                                </div>
                                <p className="mt-4 text-sm text-gray-600">Contanos qué dato necesitás corregir y cuál debería ser el valor correcto.</p>
                                <textarea value={detalleSolicitud} onChange={(evento) => setDetalleSolicitud(evento.target.value)} required rows="5" placeholder="Ej.: Solicito actualizar el teléfono a..." className="mt-4 w-full resize-none border border-[#cfdbe3] p-3 text-sm text-[#132A46] outline-none focus:border-[#1D7BB6]" />
                                <div className="mt-5 flex justify-end gap-3">
                                    <button type="button" onClick={cerrarSolicitud} className="border border-[#d7e0e5] px-4 py-2 text-sm text-[#17384f] hover:bg-[#f4f9fc]">Cancelar</button>
                                    <button type="submit" className="bg-[#1b527d] px-4 py-2 text-sm font-bold text-white hover:bg-[#164568]">Enviar solicitud</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
