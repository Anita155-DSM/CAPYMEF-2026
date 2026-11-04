import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBuilding,
  FaChevronDown,
  FaEnvelope,
  FaIdCard,
  FaRightFromBracket,
} from "react-icons/fa6";
import { useAuth } from "@/app/providers/AuthContext";
import { mayuscula } from "@/features/area-socio/utils/cuotas";
import { iniciales } from "@/features/area-socio/utils/empresa";

const ENLACES_SOCIO = [{ to: "/socios/empresa", icono: FaBuilding, texto: "Mi empresa" }];

/**
 * Avatar con menú desplegable para el encabezado del panel de socio.
 * Disposición: [Avatar a la izquierda] + [Nombre y Categoría en el medio] + [Flecha abajo a la derecha]
 */
export default function MenuPerfilSocio({ enlaces = ENLACES_SOCIO, etiqueta }) {
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

  const nombre =
    usuario?.razonSocial || (etiqueta ? usuario?.nombre || usuario?.email : "") || "Tu empresa";
  const categoria = etiqueta || mayuscula(usuario?.categoria) || "Socio";
  const avatar = iniciales(nombre);

  return (
    <div ref={ref} className="relative">
      {/* Botón de perfil: Avatar a la izquierda + Nombre/Categoría + Flechita abajo a la derecha */}
      <button
        type="button"
        aria-label="Abrir menú de perfil"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className="flex cursor-pointer items-center gap-3 rounded-xl py-1 pr-1.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-primary to-sidebar text-sm font-semibold text-white shadow-xs ring-2 ring-surface-blue">
          {avatar}
        </span>

        <div className="hidden text-left sm:block">
          <p className="max-w-[220px] truncate text-sm font-semibold text-navy">
            {nombre}
          </p>
          <p className="text-xs font-medium text-primary">
            {etiqueta ? categoria : `Socio ${categoria}`}
          </p>
        </div>

        <FaChevronDown
          className={`shrink-0 text-xs text-navy/70 transition-transform duration-200 ${
            abierto ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Tarjeta desplegable */}
      {abierto && (
        <div
          className="animacion-modal absolute right-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl sm:w-80"
          role="menu"
        >
          {/* Cabecera con avatar grande y datos identificatorios */}
          <div className="bg-linear-to-br from-navy via-sidebar to-primary p-5">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15 text-base font-semibold text-white ring-1 ring-white/30">
                {avatar}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold leading-tight text-white">
                  {nombre}
                </p>
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-[#8bd0f8]">
                  Socio {categoria}
                </p>
              </div>
            </div>
          </div>

          {/* Datos rápidos */}
          <div className="divide-y divide-slate-100 border-b border-slate-100">
            {usuario?.cuit && (
              <div className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-blue text-xs text-primary">
                  <FaIdCard />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    CUIT
                  </p>
                  <p className="truncate text-sm font-semibold text-navy tabular-nums">
                    {usuario.cuit}
                  </p>
                </div>
              </div>
            )}
            {usuario?.email && (
              <div className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-blue text-xs text-primary">
                  <FaEnvelope />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Correo electrónico
                  </p>
                  <p className="truncate text-sm font-semibold text-navy">
                    {usuario.email}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Accesos rápidos */}
          {enlaces.length > 0 && (
            <nav className="p-2" role="none">
              {enlaces.map(({ to, icono: Icono, texto }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setAbierto(false)}
                  role="menuitem"
                  className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-surface-blue hover:text-primary"
                >
                  <Icono className="shrink-0 text-primary" />
                  {texto}
                </Link>
              ))}
            </nav>
          )}

          {/* Cerrar sesión */}
          <div className={`p-2 ${enlaces.length > 0 ? "border-t border-slate-100" : ""}`}>
            <button
              type="button"
              role="menuitem"
              onClick={salir}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
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
