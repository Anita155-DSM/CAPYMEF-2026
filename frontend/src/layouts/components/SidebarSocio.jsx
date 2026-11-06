import { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  FaBuilding,
  FaCalendarCheck,
  FaHouse,
  FaMoneyBillWave,
  FaNewspaper,
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
  `group flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left text-sm transition-all duration-200 ${
    isActive
      ? "bg-white/16 font-semibold text-white shadow-xs ring-1 ring-white/20"
      : "font-medium text-white/75 hover:bg-white/8 hover:text-white"
  }`;

export default function SidebarSocio({ abierto, onCerrar, categoria, cuotas }) {
  useBloquearScroll(abierto);

  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, onCerrar]);

  // Ven "Pagos" los socios activos y quienes tengan cuotas generadas (ej: Adherente degradado por mora que debe regularizar)
  const menu = MENU_BASE.filter(
    (item) => !item.soloConCuota || abonaCuotaSocial(categoria, cuotas)
  );

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
            to="/socios"
            onClick={onCerrar}
            aria-label="Ir al inicio del portal de socios"
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
                Portal de Socios
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

        <nav aria-label="Menú del socio" className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
          {menu.map(({ nombre, icono: Icono, ruta, exacta }) => (
            <NavLink key={ruta} to={ruta} end={exacta} onClick={onCerrar} className={claseItem}>
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
