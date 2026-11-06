import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { FaBars, FaChevronRight } from "react-icons/fa6";
import { obtenerPerfil } from "../services/authServices.js";
import { useAuth } from "@/app/providers/AuthContext";
import { useMisCuotas } from "@/features/area-socio/hooks/useMisCuotas";
import CampanaNotificaciones from "@/features/notificaciones/components/CampanaNotificaciones";
import SidebarSocio from "./components/SidebarSocio";
import MenuPerfilSocio from "./components/MenuPerfilSocio";

const TITULOS_RUTA = {
  "/socios": "Resumen general",
  "/socios/empresa": "Mi empresa",
  "/socios/pagos": "Gestión de pagos",
  "/socios/eventos": "Eventos y capacitaciones",
  "/socios/noticias": "Novedades institucionales",
};

export default function SocioLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { usuario, actualizarUsuario } = useAuth();
  const [cargandoPerfil, setCargandoPerfil] = useState(() => !usuario?.localidad && !usuario?.rubro);
  const { cuotas, errorCuotas, recargarCuotas } = useMisCuotas();
  const { pathname } = useLocation();

  // Traemos el perfil fresco del backend y lo guardamos en el contexto
  useEffect(() => {
    obtenerPerfil().then((resultado) => {
      if (resultado.exito) actualizarUsuario(resultado.data);
      setCargandoPerfil(false);
    });
  }, [actualizarUsuario]);

  // useCallback: el sidebar lo usa en un efecto (Escape) y no queremos que se re-suscriba en cada render
  const cerrarMenu = useCallback(() => setMenuAbierto(false), []);

  const seccionActual = TITULOS_RUTA[pathname] || "Panel de socio";

  return (
    <div className="min-h-screen bg-surface text-navy font-socio antialiased">
      {/* Se pasa la categoría raw (sin mayuscula) para que el sidebar pueda filtrar */}
      <SidebarSocio
        abierto={menuAbierto}
        onCerrar={cerrarMenu}
        categoria={usuario.categoria}
        cuotas={cuotas}
      />

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
                Portal de Socios
              </span>
              <FaChevronRight className="text-[10px] text-slate-300" />
              <span className="font-semibold text-navy/80">{seccionActual}</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <CampanaNotificaciones />
            <div className="hidden h-7 w-px bg-slate-200 sm:block" />
            <MenuPerfilSocio />
          </div>
        </header>

        <main className="mx-auto max-w-[1380px] p-5 sm:p-8">
          {/* ACÁ SE RENDERIZAN LAS PÁGINAS HIJAS SIN RECARGAR EL LAYOUT */}
          <Outlet
            context={{
              usuario,
              actualizarUsuario,
              cargandoPerfil,
              cuotas,
              errorCuotas,
              recargarCuotas,
            }}
          />
        </main>
      </div>
    </div>
  );
}
