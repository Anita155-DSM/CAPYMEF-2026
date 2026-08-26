import { Link, useLocation } from "react-router-dom";
import Logo from "../assets/img/Logo.png";

export default function NavbarPublico() {
    const location = useLocation();

    return (
        <nav className="fixed top-0 left-0 z-50 flex w-full items-center justify-between gap-2 overflow-x-auto border-b border-gray-200 bg-white px-2 py-2 font-sans shadow-sm sm:px-4 md:px-8">

            {/* SECCIÓN IZQUIERDA: LOGO */}
            <div className="flex-shrink-0">
                <Link to="/">
                    <img src={Logo} alt="LogoCAPYMEF" className="h-9 w-auto object-contain sm:h-10 md:h-12" />
                </Link>
            </div>

            {/* SECCIÓN CENTRAL: ENLACES PÚBLICOS CON SUBRAYADO ACTIVO */}
            <div className="flex flex-shrink-0 items-center justify-center gap-2 text-[11px] sm:gap-4 sm:text-sm md:flex-grow md:gap-7 md:text-base">
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
            <div className="flex flex-shrink-0 gap-1 sm:gap-3">
                {/* Botón de Login */}
                <Link
                    to="/login"
                    className="flex items-center whitespace-nowrap rounded-md bg-[#1D7BB6] px-2 py-2 text-[11px] font-bold text-white transition-colors hover:bg-[#156091] sm:px-3 sm:text-sm md:px-4 md:text-base"
                >
                    Iniciar sesión
                </Link>
            </div>
        </nav>
    );
}