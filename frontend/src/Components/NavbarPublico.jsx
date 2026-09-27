import { useState, useEffect } from "react";
import { FaBars, FaXmark } from "react-icons/fa6";
import { Link, useLocation } from "react-router-dom";
import Logo from "../assets/img/Logo.png";

export default function NavbarPublico() {
    const location = useLocation();
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [seccionActiva, setSeccionActiva] = useState("inicio");

    const enlaces = [
        { id: "inicio", nombre: "Inicio" },
        { id: "novedades", nombre: "Novedades" },
        { id: "nosotros", nombre: "Nosotros" },
        { id: "beneficios", nombre: "Beneficios" },
        { id: "informacion", nombre: "Información" },
        { id: "vinculacion", nombre: "Vinculación" },
        { id: "contacto", nombre: "Contacto" },
    ];

    useEffect(() => {
        if (location.pathname !== '/') return;

        const manejarScroll = () => {
            const scrollY = window.scrollY;
            if (scrollY < 100) {
                setSeccionActiva("inicio");
                return;
            }

            let actual = "inicio";
            for (const enlace of enlaces) {
                const elemento = document.getElementById(enlace.id);
                if (elemento) {
                    const rect = elemento.getBoundingClientRect();
                    if (rect.top <= 150) {
                        actual = enlace.id;
                    }
                }
            }
            setSeccionActiva(actual);
        };

        window.addEventListener("scroll", manejarScroll);
        manejarScroll();

        return () => window.removeEventListener("scroll", manejarScroll);
    }, [location.pathname]);

    const hacerScrollSuave = (e, id) => {
        e.preventDefault();
        
        if (location.pathname !== '/') {
            window.location.href = `/#${id}`;
            return;
        }

        const elemento = document.getElementById(id);
        if (elemento) {
            const offset = 70; 
            const elementPosition = elemento.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
      
            window.scrollTo({
                 top: offsetPosition,
                 behavior: "smooth"
            });
        }
        setMenuAbierto(false);
    };

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm font-sans border-b border-gray-200">
            <div className="flex items-center justify-between gap-2 px-3 sm:px-6 lg:px-8 py-2">

                {/* LOGO */}
                <div className="flex-shrink-0">
                    <Link to="/" onClick={(e) => hacerScrollSuave(e, 'inicio')} aria-label="Ir al inicio">
                        <img src={Logo} alt="Logo CAPYMEF" className="h-8 sm:h-10 w-auto object-contain" />
                    </Link>
                </div>

                {/* ENLACES CENTRALES */}
                <div className="hidden lg:flex flex-grow justify-center items-center gap-2 xl:gap-5 text-sm">
                    {enlaces.map((enlace) => {
                        const activo = seccionActiva === enlace.id && location.pathname === '/';
                        return (
                            <a
                                key={enlace.id}
                                href={`#${enlace.id}`}
                                onClick={(e) => hacerScrollSuave(e, enlace.id)}
                                className={`font-semibold px-4 py-1.5 transition-all duration-300 ${
                                    activo
                                        ? "text-[#1D7BB6] bg-[#E5F1F8] rounded-full" // <-- CAMBIO: rounded-full sin borde inferior
                                        : "text-gray-600 hover:text-[#1D7BB6] hover:bg-gray-50 rounded-full"
                                }`}
                            >
                                {enlace.nombre}
                            </a>
                        );
                    })}
                </div>

                {/* BOTONES DERECHA */}
                <div className="flex-shrink-0 flex items-center gap-2">
                    <Link
                        to="/login"
                        className="bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold py-2 px-5 text-sm rounded-full transition-colors flex items-center whitespace-nowrap shadow-md"
                    >
                        Iniciar sesión
                    </Link>
                    
                    <button
                        type="button"
                        onClick={() => setMenuAbierto(!menuAbierto)}
                        className="lg:hidden p-2 text-[#1A4B76]"
                        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
                    >
                        {menuAbierto ? <FaXmark size={24} /> : <FaBars size={24} />}
                    </button>
                </div>
            </div>

            {/* MENÚ MÓVIL */}
            {menuAbierto && (
                <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-gray-200 shadow-xl px-4 py-4 flex flex-col gap-1">
                    {enlaces.map((enlace) => {
                        const activo = seccionActiva === enlace.id && location.pathname === '/';
                        return (
                            <a
                                key={enlace.id}
                                href={`#${enlace.id}`}
                                onClick={(e) => hacerScrollSuave(e, enlace.id)}
                                className={`block py-2 px-4 font-semibold transition-colors border-l-4 ${
                                    activo
                                        ? "bg-[#E5F1F8] text-[#1D7BB6] border-[#1D7BB6] rounded-r-md"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-[#1D7BB6] border-transparent rounded-r-md"
                                }`}
                            >
                                {enlace.nombre}
                            </a>
                        );
                    })}
                </div>
            )}
        </nav>
    );
}