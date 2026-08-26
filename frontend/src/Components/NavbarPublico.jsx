import { Link, useLocation } from "react-router-dom";
import Logo from "../assets/img/Logo.png";

export default function NavbarPublico() {
    const location = useLocation();

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-white flex items-center justify-between px-8 py-2 shadow-sm font-sans border-b border-gray-200">

            {/* SECCIÓN IZQUIERDA: LOGO */}
            <div className="flex-shrink-0">
                <Link to="/">
                    <img src={Logo} alt="LogoCAPYMEF" className="h-12 w-auto object-contain" />
                </Link>
            </div>

            {/* SECCIÓN CENTRAL: ENLACES PÚBLICOS CON SUBRAYADO ACTIVO */}
            <div className="hidden md:flex flex-grow justify-center items-center gap-7 text-base">
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
            <div className="flex-shrink-0 flex gap-3">
                {/* Botón de Login */}
                <Link
                    to="/login"
                    className="bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold py-2 px-4 text-base rounded-md transition-colors flex items-center"
                >
                    Iniciar sesión
                </Link>
            </div>
        </nav>
    );
}