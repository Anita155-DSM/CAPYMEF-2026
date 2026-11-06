import { useCallback, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { FaBars, FaChevronRight } from "react-icons/fa6";
import CampanaNotificaciones from "@/features/notificaciones/components/CampanaNotificaciones";
import SidebarAdmin from "./components/SidebarAdmin";
import MenuPerfilSocio from "./components/MenuPerfilSocio";

const TITULOS_RUTA = {
  "/admin/inicio": "Resumen general",
  "/admin/noticias": "Gestión de noticias",
  "/admin/eventos": "Eventos y capacitaciones",
  "/admin/finanzas": "Finanzas y cuotas",
  "/admin/registros": "Solicitudes pendientes",
  "/admin/socios": "Padrón de socios",
};

export default function MainLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();
  // useCallback: el sidebar lo usa en un efecto (Escape) y no queremos que se re-suscriba en cada render
  const cerrarMenu = useCallback(() => setMenuAbierto(false), []);

  const seccionActual = TITULOS_RUTA[pathname] || "Administración";

  return (
    <div className="min-h-screen bg-surface text-navy font-socio antialiased">
      <SidebarAdmin abierto={menuAbierto} onCerrar={cerrarMenu} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 shadow-[0_1px_3px_rgba(19,42,70,0.04)] backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl p-2 text-xl text-sidebar transition-colors hover:bg-surface-blue lg:hidden"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
            >
              <FaBars />
            </button>

            <div className="hidden items-center gap-2 text-xs font-medium text-slate-400 sm:flex">
              <span className="font-semibold uppercase tracking-wider text-primary/80">
                Panel de Administración
              </span>
              <FaChevronRight className="text-[10px] text-slate-300" />
              <span className="font-semibold text-navy/80">{seccionActual}</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <CampanaNotificaciones />
            <div className="hidden h-7 w-px bg-slate-200 sm:block" />
            <MenuPerfilSocio enlaces={[]} etiqueta="Administrador" />
          </div>
        </header>

        <main className="mx-auto max-w-[1380px] p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
