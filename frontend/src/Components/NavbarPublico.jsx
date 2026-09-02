import { useState } from "react";
import { FaBars, FaXmark } from "react-icons/fa6";
import { Link, useLocation } from "react-router-dom";
import Logo from "../assets/img/Logo.png";

export default function NavbarPublico() {
    const location = useLocation();
    const [menuAbierto, setMenuAbierto] = useState(false);
    const enlaces = [
        ["Inicio", "/"],
        ["Autoridades", "/autoridades"],
        ["Noticias", "/noticias"],
        ["Estatuto", "/estatuto"],
        ["Balance", "/balance"],
    ];

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm font-sans border-b border-gray-200">
            <div className="flex items-center justify-between gap-2 px-3 sm:px-6 lg:px-8 py-2">

            {/* SECCIÓN IZQUIERDA: LOGO */}
            <div className="flex-shrink-0">
                <Link to="/" aria-label="Ir al inicio">
                    <img src={Logo} alt="Logo CAPYMEF" className="h-10 sm:h-12 w-auto object-contain" />
                </Link>
            </div>

            {/* SECCIÓN CENTRAL: ENLACES PÚBLICOS CON SUBRAYADO ACTIVO */}
            <div className="hidden md:flex flex-grow justify-center items-center gap-4 lg:gap-7 text-sm lg:text-base">
                <Link to="/" className={`font-semibold transition-colors pb-1 ${location.pathname === '/'
                    ? 'text-[#1D7BB6] border-b-2 border-[#1D7BB6]'
                    : 'text-black hover:text-[#1D7BB6] hover:border-b-2 hover:border-[#1D7BB6]'
                    }`}>Inicio</Link>

                <Link to="/autoridades" className={`font-semibold transition-colors ${location.pathname === '/autoridades'
                    ? 'text-[#1D7BB6] border-b-2 border-[#1D7BB6] pb-1'
                    : 'text-black hover:text-[#1D7BB6] hover:border-b-2 hover:border-[#1D7BB6] pb-1'
                    }`}>Autoridades</Link>

                <Link to="/noticias" className={`font-semibold transition-colors ${location.pathname === '/noticias'
                    ? 'text-[#1D7BB6] border-b-2 border-[#1D7BB6] pb-1'
                    : 'text-black hover:text-[#1D7BB6] hover:border-b-2 hover:border-[#1D7BB6] pb-1'
                    }`}>Noticias</Link>

                <Link to="/estatuto" className={`font-semibold transition-colors ${location.pathname === '/estatuto'
                    ? 'text-[#1D7BB6] border-b-2 border-[#1D7BB6] pb-1'
                    : 'text-black hover:text-[#1D7BB6] hover:border-b-2 hover:border-[#1D7BB6] pb-1'
                    }`}>Estatuto</Link>

                <Link to="/balance" className={`font-semibold transition-colors ${location.pathname === '/balance'
                    ? 'text-[#1D7BB6] border-b-2 border-[#1D7BB6] pb-1'
                    : 'text-black hover:text-[#1D7BB6] hover:border-b-2 hover:border-[#1D7BB6] pb-1'
                    }`}>Balance</Link>
            </div>

            {/* SECCIÓN DERECHA: BOTONES DE INGRESO/REGISTRO */}
            <div className="flex-shrink-0 flex items-center gap-2">
                {/* Botón de Login */}
                <Link
                    to="/login"
                    className="bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold py-2 px-3 sm:px-4 text-sm sm:text-base rounded-md transition-colors flex items-center whitespace-nowrap"
                >
                    Iniciar sesión
                </Link>
                <button
                    type="button"
                    onClick={() => setMenuAbierto(!menuAbierto)}
                    className="md:hidden p-2 text-[#1A4B76]"
                    aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
                    aria-expanded={menuAbierto}
                >
                    {menuAbierto ? <FaXmark size={22} /> : <FaBars size={22} />}
                </button>
            </div>
            </div>
            {menuAbierto && (
                <div className="md:hidden border-t border-gray-200 px-4 py-2">
                    {enlaces.map(([nombre, ruta]) => (
                        <Link
                            key={ruta}
                            to={ruta}
                            onClick={() => setMenuAbierto(false)}
                            className="block py-2 font-semibold text-[#1A4B76]"
                        >
                            {nombre}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
}