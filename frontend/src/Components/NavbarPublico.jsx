import { Link, useLocation } from "react-router-dom";
import Logo from "../assets/img/Logo.png";

export default function NavbarPublico() {
    const location = useLocation();

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-white flex items-center justify-between px-8 py-1.5 shadow-sm font-sans border-b border-gray-200">

            {/* SECCIÓN IZQUIERDA: LOGO */}
            <div className="flex-shrink-0">
                <Link to="/">
                    <img src={Logo} alt="LogoCAPYMEF" className="h-10 w-auto object-contain" />
                </Link>
            </div>

            {/* SECCIÓN CENTRAL: ENLACES PÚBLICOS CON SUBRAYADO ACTIVO */}
            <div className="hidden md:flex flex-grow justify-center items-center gap-6 text-sm">
                <Link to="/autoridades" className={`font-semibold transition-colors ${location.pathname === '/autoridades'
                    ? 'text-[#132A46] border-b-2 border-[#132A46] pb-1'
                    : 'text-[#1D7BB6] hover:text-[#132A46]'
                    }`}>Autoridades</Link>

                <Link to="/estatuto" className={`font-semibold transition-colors ${location.pathname === '/estatuto'
                    ? 'text-[#132A46] border-b-2 border-[#132A46] pb-1'
                    : 'text-[#1D7BB6] hover:text-[#132A46]'
                    }`}>Estatuto</Link>

                <Link to="/balance" className={`font-semibold transition-colors ${location.pathname === '/balance'
                    ? 'text-[#132A46] border-b-2 border-[#132A46] pb-1'
                    : 'text-[#1D7BB6] hover:text-[#132A46]'
                    }`}>Balance</Link>
            </div>

            {/* SECCIÓN DERECHA: BOTONES DE INGRESO/REGISTRO */}
            <div className="flex-shrink-0 flex gap-3">
                {/* Botón de Login */}
                <Link
                    to="/login"
                    className="bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold py-1.5 px-4 text-sm rounded-md transition-colors flex items-center"
                >
                    Iniciar sesión
                </Link>
            </div>
        </nav>
    );
}