import { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  FaCalendarCheck,
  FaClipboardCheck,
  FaHouse,
  FaMoneyBillWave,
  FaNewspaper,
  FaUserGroup,
  FaXmark,
} from "react-icons/fa6";
import logo from "@/assets/img/logo.png";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";

const OPCIONES_MENU = [
  { nombre: "Inicio", ruta: "/admin/inicio", icono: FaHouse },
  { nombre: "Noticias", ruta: "/admin/noticias", icono: FaNewspaper },
  { nombre: "Eventos", ruta: "/admin/eventos", icono: FaCalendarCheck },
  { nombre: "Finanzas", ruta: "/admin/finanzas", icono: FaMoneyBillWave },
  { nombre: "Registros", ruta: "/admin/registros", icono: FaClipboardCheck },
  { nombre: "Socios", ruta: "/admin/socios", icono: FaUserGroup },
  { nombre: "Vista Socio (Test)", ruta: "/socios", icono: FaUserGroup },
];

const claseItem = ({ isActive }) =>
  `group flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left text-sm transition-all duration-200 ${
    isActive
      ? "bg-white/16 font-semibold text-white shadow-xs ring-1 ring-white/20"
      : "font-medium text-white/75 hover:bg-white/8 hover:text-white"
  }`;

/**
 * Menú lateral del administrador (unificado con el diseño de SidebarSocio).
 */
export default function SidebarAdmin({ abierto, onCerrar }) {
  useBloquearScroll(abierto);

  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, onCerrar]);

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-linear-to-b from-navy via-sidebar to-[#143d60] text-white shadow-xl transition-transform duration-300 lg:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Cabecera institucional con logo */}
        <div className="flex h-20 shrink-0 items-center justify-between gap-2.5 border-b border-white/10 px-5">
          <Link
            to="/admin/inicio"
            onClick={onCerrar}
            aria-label="Ir al inicio del panel de administración"
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <img
              src={logo}
              alt="logo CAPYMEF"
              className="h-10 w-auto shrink-0 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
            />
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7cc8f5]">
                CAPYMEF
              </span>
              <span className="block truncate text-xs font-medium leading-tight text-white/90">
                Administración
              </span>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-xl text-white/80 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onCerrar}
            aria-label="Cerrar menú"
          >
            <FaXmark />
          </button>
        </div>

        {/* Navegación principal */}
        <div className="px-5 pt-6 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
            Navegación
          </p>
        </div>

        <nav aria-label="Menú del administrador" className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
          {OPCIONES_MENU.map(({ nombre, icono: Icono, ruta }) => (
            <NavLink key={ruta} to={ruta} onClick={onCerrar} className={claseItem}>
              {({ isActive }) => (
                <>
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-base transition-colors ${
                      isActive
                        ? "bg-primary text-white shadow-xs"
                        : "bg-white/6 text-white/80 group-hover:bg-white/12 group-hover:text-white"
                    }`}
                  >
                    <Icono />
                  </span>
                  <span className="truncate">{nombre}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {abierto && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-navy/50 backdrop-blur-[2px] lg:hidden"
          onClick={onCerrar}
          aria-label="Cerrar menú"
        />
      )}
    </>
  );
}
