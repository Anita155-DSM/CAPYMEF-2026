import { cn } from "@/shared/utils/cn";
import { estiloDeTipo, tiempoRelativo } from "../utils/notificaciones";

/** Una fila del panel. Las no leídas llevan fondo celeste suave y un puntito. */
export default function ItemNotificacion({ notificacion, onAbrir }) {
  const { Icono, clase } = estiloDeTipo(notificacion.tipo);

  return (
    <li>
      <button
        type="button"
        onClick={() => onAbrir(notificacion)}
        className={cn(
          "flex w-full cursor-pointer items-start gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-surface",
          !notificacion.leida && "bg-surface-blue/45"
        )}
      >
        <span
          className={cn(
            "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm",
            clase
          )}
        >
          <Icono />
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block text-sm text-navy",
              !notificacion.leida ? "font-semibold" : "font-medium"
            )}
          >
            {notificacion.titulo}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-slate-600">
            {notificacion.mensaje}
          </span>
          <span className="mt-1 block text-[11px] font-medium text-slate-400">
            {tiempoRelativo(notificacion.createdAt)}
          </span>
        </span>

        {!notificacion.leida && (
          <span
            className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"
            aria-label="No leída"
          />
        )}
      </button>
    </li>
  );
}
