import { Outlet } from 'react-router-dom';
import { 
  FaHome, FaUsers, FaClipboardList, FaDollarSign, 
  FaCalendarCheck, FaBullhorn, FaCog, FaBell, 
  FaSearch, FaUserCircle 
} from 'react-icons/fa';

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-[#F4F7F9] font-sans overflow-hidden">
      
      {/* SIDEBAR FIJO */}
      <aside className="w-64 bg-[#1B4F7A] text-white flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="h-20 flex items-center justify-center border-b border-white/10">
            <span className="font-bold text-xl tracking-widest">CAPYMEF</span>
          </div>

          <nav className="flex flex-col mt-6">
            {/* Opciones del menú (dejé una sola para no hacer largo el código, acá van todas) */}
            <div className="flex items-center gap-4 px-8 py-4 bg-[#4A789C] border-l-4 border-white cursor-pointer transition-colors">
              <FaHome className="text-xl" />
              <span className="font-bold text-sm tracking-wider">INICIO</span>
            </div>
            {/* ... resto de las opciones del menú ... */}
          </nav>
        </div>
        <div className="p-8">
          <FaCog className="text-2xl cursor-pointer hover:text-gray-300 transition-colors" />
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