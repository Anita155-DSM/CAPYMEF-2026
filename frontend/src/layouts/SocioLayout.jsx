import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  FaBell,
  FaBuilding,
  FaCalendarCheck,
  FaCircleUser,
  FaGear,
  FaHouse,
  FaMoneyBillWave,
  FaNewspaper,
  FaBars,
  FaXmark,
} from "react-icons/fa6";
import logo from "../assets/img/Logo.png";
import { obtenerPerfil } from "../services/authServices";

export default function SocioLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [usuario, setUsuario] = useState(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : {};
  });

  const location = useLocation(); // Para saber en qué ruta estamos y marcar el menú activo

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const resultado = await obtenerPerfil();
        if (resultado.exito) {
          setUsuario(resultado.data);
          localStorage.setItem("usuario", JSON.stringify(resultado.data));
        }
      } catch (error) {
        console.error("No se pudo cargar el perfil del socio:", error);
      }
    };
    cargarPerfil();
  }, []);

  const nombreEmpresa = usuario.razonSocial || "Tu empresa";
  const categoria = usuario.categoria
    ? usuario.categoria.replace(/^./, letra => letra.toUpperCase())
    : "Socio";

  // Mapeamos las rutas reales
  const menu = [
    { nombre: "Inicio", icono: FaHouse, ruta: "/socios" },
    { nombre: "Mi empresa", icono: FaBuilding, ruta: "/socios/empresa" },
    { nombre: "Pagos", icono: FaMoneyBillWave, ruta: "/socios/pagos" },
    { nombre: "Eventos", icono: FaCalendarCheck, ruta: "/socios/eventos" },
    { nombre: "Noticias", icono: FaNewspaper, ruta: "/socios/noticias" },
  ];

  return (
    <div className="min-h-screen bg-[#eef6fb] text-[#132A46] font-sans">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#1b527d] text-white transition-transform duration-300 lg:translate-x-0 ${menuAbierto ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-3">
          <div className="flex justify-center ml-10">
            <Link to="/">
              <img
                src="../src/assets/img/Logo.png"
                alt="Logo CAPYMEF"
                className="w-30 opacity-90 cursor-pointer hover:opacity-100 transition-opacity"
              />
            </Link>
          </div>
          <button
            className="lg:hidden text-2xl"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
          >
            <FaXmark />
          </button>
        </div>
        <nav className="space-y-2 px-3 py-7">
          {menu.map(({ nombre, icono: Icono, ruta }) => (
            <Link
              key={nombre}
              to={ruta}
              onClick={() => setMenuAbierto(false)}
              className={`flex w-full items-center gap-4 border-l-4 px-4 py-3 text-left text-sm font-bold transition-colors ${location.pathname === ruta ? "border-[#38a4df] bg-white/20" : "border-transparent hover:bg-white/10"}`}
            >
              <Icono className="w-6 text-lg" />
              {nombre}
            </Link>
          ))}
        </nav>
        <button className="absolute bottom-7 left-7 flex items-center gap-4 text-sm font-bold text-white/90 hover:text-white">
          <FaGear className="text-xl" /> Configuración
        </button>
      </aside>

      {menuAbierto && (
        <button
          className="fixed inset-0 z-30 bg-[#132A46]/50 lg:hidden"
          onClick={() => setMenuAbierto(false)}
          aria-label="Cerrar menú"
        />
      )}

      <div className="lg:pl-64">
        <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-5 shadow-sm sm:px-8">
          <button
            className="text-2xl text-[#1b527d] lg:hidden"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
          >
            <FaBars />
          </button>
          <div className="hidden text-sm text-gray-500 sm:block"></div>
          <div className="ml-auto flex items-center gap-4 sm:gap-6">
            <button
              className="relative text-xl text-[#1D7BB6]"
              aria-label="Notificaciones"
            >
              <FaBell />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#e66d4a]" />
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-[#132A46]">
                {nombreEmpresa}
              </p>
              <p className="text-xs text-gray-500">{categoria}</p>
            </div>
            <FaCircleUser className="text-4xl text-[#1D7BB6]" />
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] p-5 sm:p-8">
          {/* ACÁ SE RENDERIZAN LAS PÁGINAS HIJAS SIN RECARGAR EL LAYOUT */}
          <Outlet context={{ usuario }} />
        </main>
      </div>
    </div>
  );
}
