import { default as Logo } from "../assets/img/logo.png"
import { FaPhone, FaFacebook, FaXTwitter } from "react-icons/fa6"
import { AiFillHome } from "react-icons/ai"
import { MdEmail } from "react-icons/md"
import { useNavigate, useLocation } from "react-router-dom"

export default function Footer() {
    const navigate = useNavigate();
    const location = useLocation();

    // Función inteligente para hacer el scroll suave a cada sección desde el Footer
    const scrollToSection = (sectionId) => {
        if (location.pathname !== "/") {
            navigate("/");
            setTimeout(() => {
                executeScroll(sectionId);
            }, 300);
        } else {
            executeScroll(sectionId);
        }
    };

    const executeScroll = (sectionId) => {
        if (sectionId === "inicio") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: "smooth" });
            }
        }
    };

    return (
        <>
            <section className="mb-0 w-full bg-[#1b4f7a] font-sans">
                <div className="px-6 mx-auto sm:px-10 lg:px-24 max-w-6xl pt-14 pb-8 text-white">

                    {/* Grilla compacta alineada a la izquierda (2 columnas) */}
                    <div className="flex flex-col md:flex-row justify-start md:gap-40 max-w-4xl">

                        {/* 1. Navegación (Rutas sincronizadas con la Navbar) */}
                        <div className="flex flex-col items-start text-left">
                            <h3 className="text-base font-bold text-white mb-5">Navegación</h3>
                            <ul className="space-y-4 text-gray-200 text-sm">
                                <li>
                                    <span onClick={() => scrollToSection("inicio")} className="hover:text-white transition-colors cursor-pointer">Inicio</span>
                                </li>
                                <li>
                                    <span onClick={() => scrollToSection("novedades")} className="hover:text-white transition-colors cursor-pointer">Novedades</span>
                                </li>
                                <li>
                                    <span onClick={() => scrollToSection("nosotros")} className="hover:text-white transition-colors cursor-pointer">Nosotros</span>
                                </li>
                                <li>
                                    <span onClick={() => scrollToSection("beneficios")} className="hover:text-white transition-colors cursor-pointer">Beneficios</span>
                                </li>
                                <li>
                                    <span onClick={() => scrollToSection("informacion")} className="hover:text-white transition-colors cursor-pointer">Información</span>
                                </li>
                                <li>
                                    <span onClick={() => scrollToSection("vinculacion")} className="hover:text-white transition-colors cursor-pointer">Vinculación</span>
                                </li>
                            </ul>
                        </div>

                        {/* 2. Contacto y Redes Sociales */}
                        <div className="flex flex-col items-start text-left mt-12 md:mt-0">
                            <h3 className="text-base font-bold text-white mb-5">Contacto</h3>
                            
                            {/* Datos de contacto */}
                            <ul className="space-y-4 text-gray-200 text-sm mb-8">
                                <li className="flex items-center gap-3">
                                    <AiFillHome className="w-4 h-4 text-[#55b6e8]" />
                                    <p>Junin 651, Formosa</p>
                                </li>
                                <li className="flex items-center gap-3">
                                    <MdEmail className="w-4 h-4 text-[#55b6e8]" />
                                    <p>info@capymef.ar</p>
                                </li>
                                <li className="flex items-center gap-3">
                                    <FaPhone className="w-4 h-4 text-[#55b6e8]" />
                                    <p>0370 446-2508</p>
                                </li>
                            </ul>

                            {/* Redes Sociales - Alineadas a la izquierda */}
                            <div className="flex gap-4">
                                <a href="https://www.facebook.com/camara.capymef/" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-gray-400 flex items-center justify-center hover:border-white hover:bg-white/10 transition-all">
                                    <FaFacebook className="w-[18px] h-[18px] text-[#55b6e8]" />
                                </a>
                                <a href="https://x.com/capymef" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-gray-400 flex items-center justify-center hover:border-white hover:bg-white/10 transition-all">
                                    <FaXTwitter className="w-[18px] h-[18px] text-[#55b6e8]" />
                                </a>
                            </div>
                        </div>

                    </div>

                    {/* Línea del footer */}
                    <div className="max-w-4xl">
                        <hr className="mt-14 mb-5 border-gray-400 opacity-20" />
                        <p className="text-[12px] text-center text-gray-300">© 2026 CAPyMEF. Todos los derechos reservados.</p>
                    </div>

                </div>
            </section>
        </>
    )
}