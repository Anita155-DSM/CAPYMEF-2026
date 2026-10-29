import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBuilding,
  FaCircleUser,
  FaEnvelope,
  FaGear,
  FaIdCard,
  FaRightFromBracket,
} from "react-icons/fa6";
import { useAuth } from "@/app/providers/AuthContext";
import { mayuscula } from "@/features/area-socio/utils/cuotas";
import { iniciales } from "@/features/area-socio/utils/empresa";

/**
 * Avatar con menú desplegable para el encabezado del panel de socio.
 *
 * Al hacer clic muestra una tarjeta flotante con:
 * - Avatar de iniciales de la empresa
 * - Razón social, CUIT, categoría y correo
 * - Accesos rápidos a Mi empresa, Configuración y Cerrar sesión
 *
 * Se cierra al hacer clic fuera del menú o al presionar Escape.
 */
export default function MenuPerfilSocio() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  // Cierra el menú al hacer clic fuera
  useEffect(() => {
    if (!abierto) return undefined;
    const alClickear = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", alClickear);
    return () => document.removeEventListener("mousedown", alClickear);
  }, [abierto]);

  // Cierra el menú con Escape
  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (e) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  const salir = () => {
    setAbierto(false);
    logout();
    navigate("/login", { replace: true });
  };

  const nombre = usuario?.razonSocial || "Tu empresa";
  const categoria = mayuscula(usuario?.categoria) || "Socio";
  const avatar = iniciales(nombre);

  return (
    <div ref={ref} className="relative">
      {/* Botón avatar */}
      <button
        type="button"
        aria-label="Abrir menú de perfil"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className="text-primary transition-colors hover:text-navy focus-visible:outline-none"
      >
        <FaCircleUser className="text-4xl" />
      </button>

      {/* Tarjeta desplegable */}
      {abierto && (
        <div
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:w-80"
          role="menu"
        >
          {/* Cabecera con avatar grande y datos identificatorios */}
          <div className="bg-linear-to-br from-navy via-sidebar to-primary p-5">
            <div className="flex items-center gap-4">
              {/* Avatar grande con iniciales */}
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-white/20 text-xl font-bold text-white ring-1 ring-white/30">
                {avatar}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-white leading-tight">
                  {nombre}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-white/70 uppercase tracking-wide">
                  {categoria}
                </p>
              </div>
            </div>
          </div>

          {/* Datos rápidos */}
          <div className="divide-y divide-gray-100 border-b border-gray-100">
            {usuario?.cuit && (
              <div className="flex items-center gap-3 px-5 py-3">
                <FaIdCard className="shrink-0 text-sm text-primary" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    CUIT
                  </p>
                  <p className="truncate text-sm font-semibold text-navy">
                    {usuario.cuit}
                  </p>
                </div>
              </div>
            )}
            {usuario?.email && (
              <div className="flex items-center gap-3 px-5 py-3">
                <FaEnvelope className="shrink-0 text-sm text-primary" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Correo
                  </p>
                  <p className="truncate text-sm font-semibold text-navy">
                    {usuario.email}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Accesos rápidos */}
          <nav className="p-2" role="none">
            <Link
              to="/socios/empresa"
              onClick={() => setAbierto(false)}
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-surface-blue hover:text-primary"
            >
              <FaBuilding className="shrink-0 text-primary" />
              Mi empresa
            </Link>
            <Link
              to="/socios/configuracion"
              onClick={() => setAbierto(false)}
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-surface-blue hover:text-primary"
            >
              <FaGear className="shrink-0 text-primary" />
              Configuración
            </Link>
          </nav>

          {/* Cerrar sesión separado */}
          <div className="border-t border-gray-100 p-2">
            <button
              type="button"
              role="menuitem"
              onClick={salir}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <FaRightFromBracket className="shrink-0" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

