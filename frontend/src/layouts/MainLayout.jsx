import { Outlet, Link } from 'react-router-dom';
import {
  FaHome, FaUsers,
  FaCalendarCheck, FaBullhorn, FaCog, FaBell,
  FaSearch, FaUserCircle, FaUserFriends, FaDollarSign, FaRegCalendarCheck, FaClipboardList
} from 'react-icons/fa';
import { GiAcousticMegaphone } from 'react-icons/gi';


export default function MainLayout() {
  return (
    <div className="flex h-screen bg-[#F4F7F9] font-sans overflow-hidden">

      {/* SIDEBAR FIJO */}
      <aside className="w-64 bg-[#1B4F7A] text-white flex flex-col justify-between flex-shrink-0">
        <div>
          {/* IMAGEN DE CAPYMEF */}
          <div className="bottom-4 ml-9 mt-5 mb-10" >
            <Link to="/">
              <img
                src="../src/assets/img/Logo.png"
                alt="Logo CAPYMEF"
                className="w-40 opacity-90 cursor-pointer"
              />
            </Link>
          </div>

          <nav className="flex flex-col mt-6">
            {/* Opciones del menú (dejé una sola para no hacer largo el código, acá van todas) */}
            <Link to={"/admin/inicio"}>
              <div className="flex items-center gap-4 px-8 py-4 bg-[#4A789C] border-l-4 border-white cursor-pointer transition-colors">
                <FaHome className="text-xl" />
                <span className="font-bold text-sm tracking-wider">Inicio</span>
              </div>
            </Link>
            <br />
            {/*Noticias */}
            <Link to={"/admin/noticias"}>
              <div className="flex items-center gap-4 px-8 py-4 bg-[#4A789C] border-l-4 border-white cursor-pointer transition-colors">
                <GiAcousticMegaphone className="text-xl" />
                <span className="font-bold text-sm tracking-wider">Noticias</span>
              </div>
            </Link>
            <br />
            {/*Eventos */}
            <Link to={"/admin/eventos"}>
              <div className="flex items-center gap-4 px-8 py-4 bg-[#4A789C] border-l-4 border-white cursor-pointer transition-colors">
                <FaRegCalendarCheck className="text-xl" />
                <span className="font-bold text-sm tracking-wider">Eventos</span>
              </div>
            </Link>

            <br />
            {/*Finanzas */}
            <Link to={"/admin/finanzas"}>
              <div className="flex items-center gap-4 px-8 py-4 bg-[#4A789C] border-l-4 border-white cursor-pointer transition-colors">
                <FaDollarSign className="text-xl" />
                <span className="font-bold text-sm tracking-wider">Finanzas</span>
              </div>
            </Link>
            <br />
            {/*Registros */}
            <Link to={"/admin/registros"}>
              <div className="flex items-center gap-4 px-8 py-4 bg-[#4A789C] border-l-4 border-white cursor-pointer transition-colors">
                <FaClipboardList className="text-xl" />
                <span className="font-bold text-sm tracking-wider">Registros</span>
              </div>
            </Link>
            <br />
            {/*Socios */}
            <Link to={"/admin/socios"}>
              <div className="flex items-center gap-4 px-8 py-4 bg-[#4A789C] border-l-4 border-white cursor-pointer transition-colors">
                <FaUserFriends className="text-xl" />
                <span className="font-bold text-sm tracking-wider">Socios</span>
              </div>
            </Link>
          </nav>
        </div>
      </aside>

      {/* ÁREA DERECHA */}
      <main className="flex-1 flex flex-col overflow-y-auto">

        {/* TOPBAR FIJA */}
        <header className="h-20 flex items-center justify-between px-10 bg-[#F4F7F9]">
          <div className="flex items-center gap-4">
            <FaBell className="text-[#1B4F7A] text-2xl cursor-pointer hover:text-[#2673A6]" />
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar socio o CUIT..."
                className="pl-5 pr-12 py-2.5 rounded-full border border-gray-300 focus:outline-none focus:border-[#2673A6] focus:ring-1 focus:ring-[#2673A6] w-72 shadow-sm text-sm"
              />
              <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            </div>
          </div>
          <FaUserCircle className="text-[#1B4F7A] text-[40px] cursor-pointer hover:text-[#2673A6]" />
        </header>

        {/* ACÁ SE INYECTA EL CONTENIDO DINÁMICO (Inicio, Socios, Finanzas, etc.) */}
        <div className="flex-1">
          <Outlet />
        </div>

      </main>
    </div>
  );
}