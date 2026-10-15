import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
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
  FaRightFromBracket,
} from "react-icons/fa6";
import logo from "../assets/img/logo.png";
import { obtenerPerfil } from "../services/authServices.js";
import { useAuth } from "@/app/providers/AuthContext";
import { useMisCuotas } from "@/features/area-socio/hooks/useMisCuotas";
import { mayuscula } from "@/features/area-socio/utils/cuotas";

const MENU = [
  { nombre: "Inicio", icono: FaHouse, ruta: "/socios" },
  { nombre: "Mi empresa", icono: FaBuilding, ruta: "/socios/empresa" },
  { nombre: "Pagos", icono: FaMoneyBillWave, ruta: "/socios/pagos" },
  { nombre: "Eventos", icono: FaCalendarCheck, ruta: "/socios/eventos" },
  { nombre: "Noticias", icono: FaNewspaper, ruta: "/socios/noticias" },
];

export default function SocioLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { usuario, actualizarUsuario, logout } = useAuth();
  const { cuotas, errorCuotas, recargarCuotas } = useMisCuotas();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Traemos el perfil fresco del backend y lo guardamos en el contexto
  useEffect(() => {
    obtenerPerfil().then((resultado) => {
      if (resultado.exito) actualizarUsuario(resultado.data);
    });
  }, [actualizarUsuario]);

  const salir = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const nombreEmpresa = usuario.razonSocial || "Tu empresa";
  const categoria = mayuscula(usuario.categoria) || "Socio";
  const tieneDeuda = Array.isArray(cuotas) && cuotas.some((c) => c.estado !== "pagada");

  return (
    <div className="min-h-screen bg-[#eef6fb] text-navy font-sans">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#1b527d] text-white transition-transform duration-300 lg:translate-x-0 ${menuAbierto ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-3">
          <div className="flex justify-center ml-10">
            <Link to="/socios" aria-label="Ir al inicio del panel de socio">
              <img src={logo} alt="logo CAPYMEF" className="w-30 opacity-90" />
            </Link>
          </div>
          <button className="lg:hidden text-2xl" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú">
            <FaXmark />
          </button>
        </div>
        <nav className="space-y-2 px-3 py-7">
          {MENU.map(({ nombre, icono: Icono, ruta }) => (
            <Link
              key={nombre}
              to={ruta}
              onClick={() => setMenuAbierto(false)}
              className={`flex w-full items-center gap-4 border-l-4 px-4 py-3 text-left text-sm font-bold transition-colors ${pathname === ruta ? "border-[#38a4df] bg-white/20" : "border-transparent hover:bg-white/10"}`}
            >
              <Icono className="w-6 text-lg" />
              {nombre}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-7 left-7 space-y-5">
          <Link
            to="/socios/configuracion"
            onClick={() => setMenuAbierto(false)}
            className={`flex items-center gap-4 text-sm font-bold hover:text-white ${pathname === "/socios/configuracion" ? "text-white" : "text-white/90"}`}
          >
            <FaGear className="text-xl" /> Configuración
          </Link>
          <button type="button" onClick={salir} className="flex items-center gap-4 text-sm font-bold text-white/90 hover:text-white">
            <FaRightFromBracket className="text-xl" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {menuAbierto && (
        <button className="fixed inset-0 z-30 bg-navy/50 lg:hidden" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú" />
      )}

      <div className="lg:pl-64">
        <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-5 shadow-sm sm:px-8">
          <button className="text-2xl text-[#1b527d] lg:hidden" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
            <FaBars />
          </button>
          <div className="hidden text-sm text-gray-500 sm:block"></div>
          <div className="ml-auto flex items-center gap-4 sm:gap-6">
            <Link
              to="/socios/pagos"
              className="relative text-xl text-primary"
              aria-label={tieneDeuda ? "Notificaciones: tenés cuotas por pagar" : "Notificaciones"}
              title={tieneDeuda ? "Tenés cuotas por pagar" : "Sin novedades"}
            >
              <FaBell />
              {tieneDeuda && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#e66d4a]" />}
            </Link>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-navy">{nombreEmpresa}</p>
              <p className="text-xs text-gray-500">{categoria}</p>
            </div>
            <Link to="/socios/configuracion" aria-label="Mi cuenta">
              <FaCircleUser className="text-4xl text-primary" />
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] p-5 sm:p-8">
          {/* ACÁ SE RENDERIZAN LAS PÁGINAS HIJAS SIN RECARGAR EL LAYOUT */}
          <Outlet context={{ usuario, actualizarUsuario, cuotas, errorCuotas, recargarCuotas }} />
        </main>
      </div>
    </div>
  );
}
