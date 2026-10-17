import { useCallback, useEffect, useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { FaBars, FaBell, FaCircleUser } from "react-icons/fa6";
import { obtenerPerfil } from "../services/authServices.js";
import { useAuth } from "@/app/providers/AuthContext";
import { useMisCuotas } from "@/features/area-socio/hooks/useMisCuotas";
import { mayuscula } from "@/features/area-socio/utils/cuotas";
import SidebarSocio from "./components/SidebarSocio";

export default function SocioLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { usuario, actualizarUsuario, logout } = useAuth();
  const { cuotas, errorCuotas, recargarCuotas } = useMisCuotas();
  const navigate = useNavigate();

  // Traemos el perfil fresco del backend y lo guardamos en el contexto
  useEffect(() => {
    obtenerPerfil().then((resultado) => {
      if (resultado.exito) actualizarUsuario(resultado.data);
    });
  }, [actualizarUsuario]);

  // useCallback: el sidebar lo usa en un efecto (Escape) y no queremos que se re-suscriba en cada render
  const cerrarMenu = useCallback(() => setMenuAbierto(false), []);

  const salir = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const nombreEmpresa = usuario.razonSocial || "Tu empresa";
  const categoria = mayuscula(usuario.categoria) || "Socio";
  const tieneDeuda = Array.isArray(cuotas) && cuotas.some((c) => c.estado !== "pagada");

  return (
    <div className="min-h-screen bg-surface text-navy font-sans">
      <SidebarSocio abierto={menuAbierto} onCerrar={cerrarMenu} onSalir={salir} />

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