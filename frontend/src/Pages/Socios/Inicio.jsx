import { useState } from "react";
import {
    FaArrowRight,
    FaBell,
    FaBuilding,
    FaCalendarCheck,
    FaChartLine,
    FaChevronRight,
    FaCircleUser,
    FaCreditCard,
    FaDownload,
    FaGear,
    FaHouse,
    FaMoneyBillWave,
    FaNewspaper,
    FaBars,
    FaXmark,
} from "react-icons/fa6";
import { Link } from "react-router-dom";
import logo from "../../assets/img/Logo.png";

function App() {
  return <img src={logo} alt="Logo" />;
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
    const usuarioGuardado = localStorage.getItem("usuario");
    const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : {};
    const nombreEmpresa = usuario.razonSocial || "Tu empresa";
    const categoria = usuario.categoria || "Socio activo";

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

    return (
        <div className="min-h-screen bg-[#eef6fb] text-[#132A46] font-sans">
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#1b527d] text-white transition-transform duration-300 lg:translate-x-0 ${menuAbierto ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
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
                    <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <p className="mb-1 text-sm font-semibold text-[#1D7BB6]">PANEL DE SOCIO</p>
                            <h1 className="text-2xl font-bold uppercase tracking-tight text-[#132A46] sm:text-3xl">Hola, {nombreEmpresa}</h1>
                            <p className="mt-2 text-sm text-gray-600">Socio N° 0042 <span className="mx-2">•</span> Servicios gráficos <span className="mx-2">•</span> Formosa Capital</p>
                        </div>
                        <span className="w-fit rounded-sm bg-[#00bf68] px-4 py-2 text-sm font-bold text-white">Estás al día!</span>
                    </section>

                    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
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
                </main>
            </div>
        </div>
    );
}
