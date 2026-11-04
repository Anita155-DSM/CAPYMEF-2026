import { useCallback, useState } from "react";
import { FaBars } from "react-icons/fa";
import { Outlet } from "react-router-dom";
import CampanaNotificaciones from "@/features/notificaciones/components/CampanaNotificaciones";
import SidebarAdmin from "./components/SidebarAdmin";
import MenuPerfilSocio from "./components/MenuPerfilSocio";

export default function MainLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  // useCallback: el sidebar lo usa en un efecto (Escape) y no queremos que se re-suscriba en cada render
  const cerrarMenu = useCallback(() => setMenuAbierto(false), []);

  return (
    <div className="flex h-dvh overflow-hidden bg-[#F4F7F9] font-sans">
      <SidebarAdmin abierto={menuAbierto} onCerrar={cerrarMenu} />

      {/* ÁREA DERECHA */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* TOPBAR: hamburguesa a la izquierda (solo celular) y perfil a la derecha */}
        <header className="z-10 flex w-full items-center justify-between bg-white px-4 py-4 shadow-sm sm:px-8">
          <button
            type="button"
            className="text-2xl text-sidebar lg:hidden"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
          >
            <FaBars />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <CampanaNotificaciones />
            <MenuPerfilSocio enlaces={[]} etiqueta="Administrador" />
          </div>
        </header>

        {/* ACÁ SE INYECTA EL CONTENIDO DINÁMICO */}
        <div className="flex-1 overflow-y-auto bg-[#F4F7F9]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}