import {
  FaClipboardList,
  FaDollarSign,
  FaHome,
  FaRegCalendarCheck,
  FaUserCircle,
  FaUserFriends
} from 'react-icons/fa';
import { GiAcousticMegaphone } from 'react-icons/gi';
import { Link, Outlet } from 'react-router-dom';

// 1. MODULARIZACIÓN DE DATOS:
const OPCIONES_MENU = [
  { nombre: "Inicio", ruta: "/admin/inicio", Icono: FaHome },
  { nombre: "Noticias", ruta: "/admin/noticias", Icono: GiAcousticMegaphone },
  { nombre: "Eventos", ruta: "/admin/eventos", Icono: FaRegCalendarCheck },
  { nombre: "Finanzas", ruta: "/admin/finanzas", Icono: FaDollarSign },
  { nombre: "Registros", ruta: "/admin/registros", Icono: FaClipboardList },
  { nombre: "Socios", ruta: "/admin/socios", Icono: FaUserFriends },
];

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-[#F4F7F9] font-sans overflow-hidden">

      {/* SIDEBAR FIJO */}
      <aside className="w-64 bg-[#1B4F7A] text-white flex flex-col flex-shrink-0 shadow-xl z-20">

        {/* IMAGEN DE CAPYMEF */}
        <div className="flex justify-center mt-8 mb-10">
          <Link to="/">
            <img
              src="../src/assets/img/Logo.png"
              alt="Logo CAPYMEF"
              className="w-40 opacity-90 cursor-pointer hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>

        <nav className="flex flex-col gap-1">
          {/* Iteramos el arreglo para no repetir el HTML 6 veces */}
          {OPCIONES_MENU.map((item, index) => (
            <Link key={index} to={item.ruta}>
              {/* Cambié el border-white fijo por un hover, así se nota qué botón estás tocando */}
              <div className="flex items-center gap-4 px-8 py-4 bg-[#1B4F7A] hover:bg-[#4A789C] border-l-4 border-transparent hover:border-white cursor-pointer transition-all">
                <item.Icono className="text-xl" />
                <span className="font-bold text-sm tracking-wider">{item.nombre}</span>
              </div>
            </Link>
          ))}
        </nav>
      </aside>

      {/* ÁREA DERECHA */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* TOPBAR FIJA (Acomodada perfectamente arriba a la derecha) */}
        <header className="w-full bg-white shadow-sm px-8 py-4 flex items-center justify-end z-10">
          <Link to="/profile" className="flex items-center gap-3 group">
            <FaUserCircle className="text-[#1B4F7A] text-[38px] cursor-pointer group-hover:text-[#2673A6] transition-colors shadow-sm rounded-full" />
          </Link>
        </header>

        {/* ACÁ SE INYECTA EL CONTENIDO DINÁMICO */}
        <div className="flex-1 overflow-y-auto bg-[#F4F7F9]">
          <Outlet />
        </div>

      </main>
    </div>
  );
}