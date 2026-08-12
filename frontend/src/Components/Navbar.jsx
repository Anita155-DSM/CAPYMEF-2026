import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa"
import Logo from "../assets/img/Logo.png";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation()

  // 1. Leemos la memoria para saber quién está navegando
  const token = localStorage.getItem("token");
  const usuarioString = localStorage.getItem("usuario");
  const usuario = usuarioString ? JSON.parse(usuarioString) : null;

  // 2. Función para cerrar sesión
  const handleLogout = () => {
    // Borramos los datos del usuario y el token
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    // Usamos window.location.href en lugar de navigate para forzar 
    // que toda la página se recargue y el Navbar se actualice al instante.
    window.location.href = "/login";
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white flex items-center justify-between px-8 py-1.5 shadow-sm font-sans border-b border-gray-200">
      <div className="flex-shrink-0">
        <Link to="/">
          <img src={Logo} alt="LogoCAPYMEF" className="h-10 w-auto object-contain" />
        </Link>
      </div>
      {/*AÑADIMOS TERNARIOS PARA SUBRAYAR SOBRE LA RUTA EN LA QUE ESTAMOS (Es solo para el estilo) */}
      <div className="hidden md:flex flex-grow justify-center items-center gap-6 text-sm">
        <Link to="/noticias" className={`font-semibold transition-colors ${location.pathname === '/noticias'
          ? 'text-[#132A46] border-b-2 border-[#132A46] pb-1'
          : 'text-[#1D7BB6] hover:text-[#132A46]'
          }`}>Noticias</Link>
        <Link to="/nosotros" className={`font-semibold transition-colors ${location.pathname === '/nosotros'
          ? 'text-[#132A46] border-b-2 border-[#132A46] pb-1'
          : 'text-[#1D7BB6] hover:text-[#132A46]'
          }`}>Nosotros</Link>
        <Link to="/socios" className={`font-semibold transition-colors ${location.pathname === '/socios'
          ? 'text-[#132A46] border-b-2 border-[#132A46] pb-1'
          : 'text-[#1D7BB6] hover:text-[#132A46]'
          }`}>Socios</Link>
        <Link to="/eventos" className={`font-semibold transition-colors ${location.pathname === '/eventos'
          ? 'text-[#132A46] border-b-2 border-[#132A46] pb-1'
          : 'text-[#1D7BB6] hover:text-[#132A46]'
          }`}>Eventos</Link>
        <Link to="/capacitacion" className={`font-semibold transition-colors ${location.pathname === '/capacitacion'
          ? 'text-[#132A46] border-b-2 border-[#132A46] pb-1'
          : 'text-[#1D7BB6] hover:text-[#132A46]'
          }`}>Capacitación</Link>

        {/* MÁGIA DE UX: Solo mostramos este botón si es admin */}
        {usuario?.rol === 'admin' && (
          <Link to="/admin/inicio" className="text-[#1D7BB6] font-bold hover:text-[#132A46] transition-colors">
            Panel Admin
          </Link>
        )}
      </div>

      <div className="flex-shrink-0 flex">
        <>

          <Link to={"/profile"}>
            <FaUserCircle className="text-[#1B4F7A] text-[40px] cursor-pointer hover:text-[#2673A6] mr-8" />
          </Link>
          {/* CONDICIONAL DEL BOTÓN */}
          {token ? (
            // Si tiene token, mostramos el botón rojo de Cerrar Sesión
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-4 text-sm rounded-md transition-colors"
            >
              Cerrar sesión
            </button>

          ) : (
            // Si NO tiene token, mostramos el botón azul original de Iniciar sesión
            <Link
              to="/login"
              className="bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold py-2 px-4 text-sm rounded-md transition-colors"
            >
              Iniciar sesión
            </Link>
          )}
        </>
      </div>
    </nav>
  );
}