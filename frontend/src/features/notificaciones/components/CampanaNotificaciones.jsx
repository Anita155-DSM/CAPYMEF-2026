import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaCheckDouble } from "react-icons/fa6";
import { toast } from "sonner";
import { useNotificaciones } from "../hooks/useNotificaciones";
import { destinoDeNotificacion } from "../utils/notificaciones";
import ItemNotificacion from "./ItemNotificacion";

/** Campana del navbar: muestra el globito de no leídas y abre el listado. */
export default function CampanaNotificaciones() {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const navigate = useNavigate();
  const {
    items,
    noLeidas,
    cargando,
    error,
    hayMas,
    cargar,
    cargarMas,
    marcarLeida,
    marcarTodasLeidas,
  } = useNotificaciones();

  // Cierra con Escape o al hacer clic afuera.
  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (e) => e.key === "Escape" && setAbierto(false);
    const alClickAfuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) setAbierto(false);
    };
    window.addEventListener("keydown", alTeclear);
    document.addEventListener("mousedown", alClickAfuera);
    return () => {
      window.removeEventListener("keydown", alTeclear);
      document.removeEventListener("mousedown", alClickAfuera);
    };
  }, [abierto]);

  const alternar = () => {
    if (!abierto) cargar();
    setAbierto((valor) => !valor);
  };

  const abrirNotificacion = (notificacion) => {
    marcarLeida(notificacion);
    const destino = destinoDeNotificacion(notificacion);
    if (destino) {
      setAbierto(false);
      navigate(destino);
    }
  };

  const leerTodas = async () => {
    const resultado = await marcarTodasLeidas();
    if (!resultado.exito) toast.error(resultado.mensaje || "No se pudieron marcar como leídas.");
  };

  return (
    <div ref={contenedorRef} className="relative">
      <button
        type="button"
        onClick={alternar}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-label={noLeidas > 0 ? `Notificaciones: ${noLeidas} sin leer` : "Notificaciones"}
        className="relative grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-surface text-lg text-primary transition-colors hover:bg-surface-blue"
      >
        <FaBell />
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-[#e66d4a] px-1 text-[11px] font-semibold leading-5 text-white tabular-nums">
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="animacion-modal fixed right-2 top-22 z-50 w-md max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl sm:right-8"
        >
          <div className="flex items-center justify-between gap-3 bg-linear-to-r from-navy via-sidebar to-primary px-5 py-4 text-white">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
              Notificaciones
              {noLeidas > 0 && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold leading-4 text-white ring-1 ring-white/30">
                  {noLeidas > 99 ? "99+" : noLeidas}
                </span>
              )}
            </h3>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={leerTodas}
                aria-label="Marcar todas como leídas"
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-medium text-white/90 transition-colors hover:text-white hover:underline"
              >
                <FaCheckDouble className="text-[11px]" />
                <span className="sm:hidden">Marcar todas</span>
                <span className="hidden sm:inline">Marcar como leídas</span>
              </button>
            )}
          </div>

          <div className="max-h-[68vh] overflow-y-auto">
            {error && <p className="px-5 py-6 text-center text-sm text-red-600">{error}</p>}

            {!error && items.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-slate-500">
                  {cargando ? "Cargando notificaciones..." : "No tenés notificaciones por el momento."}
                </p>
              </div>
            )}

            {items.length > 0 && (
              <ul className="divide-y divide-slate-100">
                {items.map((notificacion) => (
                  <ItemNotificacion
                    key={notificacion.id}
                    notificacion={notificacion}
                    onAbrir={abrirNotificacion}
                  />
                ))}
              </ul>
            )}

            {hayMas && (
              <button
                type="button"
                onClick={cargarMas}
                disabled={cargando}
                className="w-full cursor-pointer border-t border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-surface-blue/50 disabled:opacity-50"
              >
                {cargando ? "Cargando..." : "Ver anteriores"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
