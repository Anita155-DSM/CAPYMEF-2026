import { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  FaClipboardList,
  FaDollarSign,
  FaHome,
  FaRegCalendarCheck,
  FaTimes,
  FaUserFriends,
} from "react-icons/fa";
import { GiAcousticMegaphone } from "react-icons/gi";
import logo from "@/assets/img/logo.png";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";

const OPCIONES_MENU = [
  { nombre: "Inicio", ruta: "/admin/inicio", Icono: FaHome },
  { nombre: "Noticias", ruta: "/admin/noticias", Icono: GiAcousticMegaphone },
  { nombre: "Eventos", ruta: "/admin/eventos", Icono: FaRegCalendarCheck },
  { nombre: "Finanzas", ruta: "/admin/finanzas", Icono: FaDollarSign },
  { nombre: "Registros", ruta: "/admin/registros", Icono: FaClipboardList },
  { nombre: "Socios", ruta: "/admin/socios", Icono: FaUserFriends },
  { nombre: "VISTA SOCIO (TEST)", ruta: "/socios", Icono: FaUserFriends },
];

const claseItem = ({ isActive }) =>
  `flex items-center gap-4 border-l-4 px-8 py-4 transition-all ${
    isActive ? "border-white bg-[#4A789C]" : "border-transparent hover:border-white hover:bg-[#4A789C]"
  }`;

/**
 * Menú lateral del admin.
 *  - Pantallas grandes (lg+): fijo a la izquierda.
 *  - Celular/tablet: cajón que se abre con el botón de hamburguesa del header.
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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-sidebar text-white shadow-xl transition-transform duration-300 lg:static lg:z-20 lg:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar menú"
          className="absolute right-4 top-4 text-2xl text-white/90 hover:text-white lg:hidden"
        >
          <FaTimes />
        </button>

        <div className="mb-10 mt-8 flex justify-center">
          <Link to="/admin/inicio" onClick={onCerrar} aria-label="Ir al inicio del panel de administración">
            <img src={logo} alt="logo CAPYMEF" className="w-40 opacity-90" />
          </Link>
        </div>

        <nav aria-label="Menú del administrador" className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {OPCIONES_MENU.map(({ nombre, ruta, Icono }) => (
            <NavLink key={ruta} to={ruta} onClick={onCerrar} className={claseItem}>
              <Icono className="text-xl" />
              <span className="text-sm font-bold tracking-wider">{nombre}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {abierto && (
        <button type="button" className="fixed inset-0 z-30 bg-navy/50 lg:hidden" onClick={onCerrar} aria-label="Cerrar menú" />
      )}
    </>
  );
}
