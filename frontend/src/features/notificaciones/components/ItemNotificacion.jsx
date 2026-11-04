import { cn } from "@/shared/utils/cn";
import { estiloDeTipo, tiempoRelativo } from "../utils/notificaciones";

/** Una fila del panel. Las no leídas llevan fondo celeste y un puntito. */
export default function ItemNotificacion({ notificacion, onAbrir }) {
  const { Icono, clase } = estiloDeTipo(notificacion.tipo);

  return (
    <li>
      <button
        type="button"
        onClick={() => onAbrir(notificacion)}
        className={cn(
          "flex w-full items-start gap-3 border-b border-gray-100 px-5 py-3 text-left transition-colors hover:bg-gray-50",
          !notificacion.leida && "bg-blue-50/60"
        )}
      >
        <span className={cn("mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-base", clase)}>
          <Icono />
        </span>

        <span className="min-w-0 flex-1">
          <span className={cn("block text-sm text-navy", !notificacion.leida && "font-bold")}>{notificacion.titulo}</span>
          <span className="mt-0.5 block text-xs text-gray-600">{notificacion.mensaje}</span>
          <span className="mt-1 block text-[11px] text-gray-400">{tiempoRelativo(notificacion.createdAt)}</span>
        </span>

        {!notificacion.leida && (
          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#e66d4a]" aria-label="No leída" />
        )}
      </button>
    </li>
  );
}