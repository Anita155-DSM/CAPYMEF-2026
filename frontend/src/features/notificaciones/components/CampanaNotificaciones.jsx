import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa6";
import { toast } from "sonner";
import { useNotificaciones } from "../hooks/useNotificaciones";
import { destinoDeNotificacion } from "../utils/notificaciones";
import ItemNotificacion from "./ItemNotificacion";

/** Campana del navbar: muestra el globito de no leídas y abre el listado. */
export default function CampanaNotificaciones() {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const navigate = useNavigate();
  const { items, noLeidas, cargando, error, hayMas, cargar, cargarMas, marcarLeida, marcarTodasLeidas } =
    useNotificaciones();

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
    if (!abierto) cargar(); // al abrir siempre traemos la lista fresca
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
        className="relative grid h-10 w-10 place-items-center rounded-full text-xl text-primary transition-colors hover:bg-surface"
      >
        <FaBell />
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-[#e66d4a] px-1 text-[11px] font-bold leading-5 text-white">
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="fixed right-2 top-22 z-50 w-md max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl sm:right-8"
        >
          <div className="flex items-center justify-between gap-3 bg-navy px-5 py-4 text-white">
            <h3 className="flex items-center gap-2 text-base font-bold">
              Notificaciones
              {noLeidas > 0 && (
                <span className="rounded-full bg-[#e66d4a] px-2 py-0.5 text-xs font-bold leading-4">{noLeidas > 99 ? "99+" : noLeidas}</span>
              )}
            </h3>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={leerTodas}
                aria-label="Marcar todas como leídas"
                className="shrink-0 text-sm font-semibold text-white/90 hover:text-white hover:underline"
              >
                <span className="sm:hidden">Marcar todas</span>
                <span className="hidden sm:inline">Marcar todas como leídas</span>
              </button>
            )}
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {error && <p className="px-5 py-6 text-center text-base text-red-600">{error}</p>}

            {!error && items.length === 0 && (
              <p className="px-5 py-10 text-center text-base text-gray-500">
                {cargando ? "Cargando..." : "No tenés notificaciones."}
              </p>
            )}

            {items.length > 0 && (
              <ul>
                {items.map((notificacion) => (
                  <ItemNotificacion key={notificacion.id} notificacion={notificacion} onAbrir={abrirNotificacion} />
                ))}
              </ul>
            )}

            {hayMas && (
              <button
                type="button"
                onClick={cargarMas}
                disabled={cargando}
                className="w-full px-5 py-3 text-base font-bold text-primary hover:bg-surface disabled:opacity-50"
              >
                {cargando ? "Cargando..." : "Ver más"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}