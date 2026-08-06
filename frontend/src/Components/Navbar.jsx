import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    // Agregamos fixed, top-0, left-0 y z-50 para pegarlo arriba. Redujimos py-3 a py-1.5
    <nav className="fixed top-0 left-0 w-full z-50 bg-white flex items-center justify-between px-8 py-1.5 shadow-sm font-sans border-b border-gray-200">
      
      <div className="flex-shrink-0">
        <Link to="/">
          {/* Redujimos la altura del logo de h-14 a h-10 */}
          <img 
            src="../assets/img/Logo.png" 
            alt="Logo CAPYMEF" 
            className="h-10 w-auto object-contain" 
          />
        </Link>
      </div>

      {/* Redujimos el espacio entre enlaces (gap-6) y achicamos la fuente (text-sm) */}
      <div className="hidden md:flex flex-grow justify-center items-center gap-6 text-sm">
        <Link to="/noticias" className="text-[#1D7BB6] font-semibold hover:text-[#132A46] transition-colors">
          Noticias
        </Link>
        <Link to="/nosotros" className="text-[#1D7BB6] font-semibold hover:text-[#132A46] transition-colors">
          Nosotros
        </Link>
        <Link to="/contacto" className="text-[#1D7BB6] font-semibold hover:text-[#132A46] transition-colors">
          Contacto
        </Link>
        <Link to="/socios" className="text-[#1D7BB6] font-semibold hover:text-[#132A46] transition-colors">
          Socios
        </Link>
        <Link to="/eventos" className="text-[#1D7BB6] font-semibold hover:text-[#132A46] transition-colors">
          Eventos
        </Link>
        <Link to="/capacitacion" className="text-[#1D7BB6] font-semibold hover:text-[#132A46] transition-colors">
          Capacitación
        </Link>
      </div>

      <div className="flex-shrink-0">
        <Link 
          to="/login" 
          className="bg-[#1D7BB6] hover:bg-[#156091] text-white font-bold py-1.5 px-4 text-sm rounded-md transition-colors"
        >
          Iniciar sesión
        </Link>
      </div>

    </nav>
  );
}