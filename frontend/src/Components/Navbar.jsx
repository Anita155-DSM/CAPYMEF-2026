import { useState } from "react";
import { FaBars, FaXmark } from "react-icons/fa6";
import { Link, useLocation } from "react-router-dom";
import Logo from "../assets/img/Logo.png";
import { cerrarSesion } from "../services/authServices";

export default function Navbar() {
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
    <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm font-sans border-b-4 border-[#1D7BB6]">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-6 lg:px-8 py-2">
        <div className="flex-shrink-0">
          <Link to="/" aria-label="Ir al inicio">
            <img src={Logo} alt="Logo CAPYMEF" className="h-10 sm:h-12 w-auto object-contain" />
          </Link>
        </div>

        <div className="hidden md:flex flex-grow justify-center items-center gap-4 lg:gap-7 text-sm lg:text-base">
          {enlaces.map(([nombre, ruta]) => (
            <Link
              key={ruta}
              to={ruta}
              className={`font-semibold transition-colors pb-1 ${location.pathname === ruta
                ? "text-[#1D7BB6] border-b-2 border-[#1D7BB6]"
                : "text-black hover:text-[#1D7BB6] hover:border-b-2 hover:border-[#1D7BB6]"
                }`}
            >
              {nombre}
            </Link>
          ))}
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={cerrarSesion}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 sm:px-4 text-sm sm:text-base rounded-md transition-colors whitespace-nowrap"
          >
            Cerrar sesión
          </button>
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