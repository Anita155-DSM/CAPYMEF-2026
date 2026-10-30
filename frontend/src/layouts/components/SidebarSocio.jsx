import { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  FaBuilding,
  FaCalendarCheck,
  FaGear,
  FaHouse,
  FaMoneyBillWave,
  FaNewspaper,
  FaRightFromBracket,
  FaXmark,
} from "react-icons/fa6";
import logo from "@/assets/img/logo.png";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import { abonaCuotaSocial } from "@/features/area-socio/utils/cuotas";

const MENU_BASE = [
  { nombre: "Inicio", icono: FaHouse, ruta: "/socios", exacta: true },
  { nombre: "Mi empresa", icono: FaBuilding, ruta: "/socios/empresa" },
  { nombre: "Pagos", icono: FaMoneyBillWave, ruta: "/socios/pagos", soloConCuota: true },
  { nombre: "Eventos", icono: FaCalendarCheck, ruta: "/socios/eventos" },
  { nombre: "Noticias", icono: FaNewspaper, ruta: "/socios/noticias" },
];

const claseItem = ({ isActive }) =>
  `flex w-full items-center gap-4 border-l-4 px-4 py-3 text-left text-sm font-bold transition-colors ${
    isActive ? "border-[#38a4df] bg-white/20" : "border-transparent hover:bg-white/10"
  }`;

export default function SidebarSocio({ abierto, onCerrar, onSalir, categoria }) {
  useBloquearScroll(abierto);

  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, onCerrar]);

  // Solo los socios activos ven la sección "Pagos" (cuotas sociales)
  const menu = MENU_BASE.filter(
    (item) => !item.soloConCuota || abonaCuotaSocial(categoria)
  );

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-linear-to-b from-sidebar to-[#143f63] text-white transition-transform duration-300 lg:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 shrink-0 items-center gap-2.5 border-b border-white/10 px-4">
          <Link to="/" onClick={onCerrar} aria-label="Ir al inicio del panel de socio" className="flex min-w-0 flex-1 items-center gap-2">
            <img src={logo} alt="logo CAPYMEF" className="h-11 w-auto shrink-0 object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]" />
            <span className="min-w-0 flex-1 text-[12px] font-bold leading-tight text-white">
              Cámara de Pequeñas
              <br className="hidden lg:block" /> y Medianas Empresas
            </span>
          </Link>
          <button type="button" className="shrink-0 text-2xl lg:hidden" onClick={onCerrar} aria-label="Cerrar menú">
            <FaXmark />
          </button>
        </div>

        <nav aria-label="Menú del socio" className="flex-1 space-y-2 overflow-y-auto px-3 py-7">
          {menu.map(({ nombre, icono: Icono, ruta, exacta }) => (
            <NavLink key={ruta} to={ruta} end={exacta} onClick={onCerrar} className={claseItem}>
              <Icono className="w-6 text-lg" />
              {nombre}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center justify-between border-t border-white/10 px-6 py-3">
          <NavLink
            to="/socios/configuracion"
            onClick={onCerrar}
            className={({ isActive }) => `flex items-center gap-4 text-sm font-bold hover:text-white ${isActive ? "text-white" : "text-white/90"}`}
          >
            <FaGear className="text-xl" /> Configuración
          </NavLink>
          <button
            type="button"
            onClick={onSalir}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="grid h-10 w-10 place-items-center rounded-lg text-xl text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          >
            <FaRightFromBracket />
          </button>
        </div>
      </aside>

      {abierto && (
        <button type="button" className="fixed inset-0 z-30 bg-navy/50 lg:hidden" onClick={onCerrar} aria-label="Cerrar menú" />
      )}
    </>
  );
}
