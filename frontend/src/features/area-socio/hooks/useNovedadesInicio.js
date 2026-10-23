import { useEffect, useState } from "react";
import { obtenerDetalleEvento, obtenerEventosSocios } from "@/services/eventosService";
import { obtenerNoticiasSocios } from "@/services/noticiasService";
import dayjs from "@/shared/utils/fechas";
import { finDelEvento, inicioDelEvento } from "../utils/eventos";

/**
 * Próximo evento y últimas noticias para el Inicio del socio.
 * Cada bloque tiene su propio estado (cargando / error / datos) para no mostrar
 * "No hay eventos" mientras todavía se está pidiendo la información, ni cuando falló el servidor.
 *
 *   evento.cupoDisponible: undefined = consultando · null = no se pudo saber · número = cupos libres
 */
export function useNovedadesInicio() {
  const [evento, setEvento] = useState({ cargando: true, error: "", datos: null, cupoDisponible: undefined });
  const [noticias, setNoticias] = useState({ cargando: true, error: "", lista: [] });

  useEffect(() => {
    let activo = true;

    (async () => {
      const resultado = await obtenerNoticiasSocios();
      if (!activo) return;
      if (resultado.exito) setNoticias({ cargando: false, error: "", lista: (resultado.data || []).slice(0, 3) });
      else setNoticias({ cargando: false, error: resultado.mensaje || "No se pudieron cargar las noticias.", lista: [] });
    })();

    (async () => {
      const resultado = await obtenerEventosSocios();
      if (!activo) return;
      if (!resultado.exito) {
        setEvento({ cargando: false, error: resultado.mensaje || "No se pudieron cargar los eventos.", datos: null, cupoDisponible: null });
        return;
      }

      // Próximo = el primero que todavía no terminó (así un evento de hoy sigue apareciendo hasta que acaba)
      const ahora = dayjs();
      const proximo =
        (resultado.data || [])
          .filter((e) => e.fecha && !["cancelado", "finalizado"].includes(e.estado) && !finDelEvento(e).isBefore(ahora))
          .sort((a, b) => inicioDelEvento(a).diff(inicioDelEvento(b)))[0] || null;

      // /eventos/socios no informa cuántos cupos quedan: si hay límite, lo pedimos al detalle del evento
      const hayLimite = proximo?.cupoMaximo != null;
      setEvento({ cargando: false, error: "", datos: proximo, cupoDisponible: hayLimite ? undefined : null });
      if (!hayLimite) return;

      const detalle = await obtenerDetalleEvento(proximo.id);
      if (!activo) return;
      const libres = detalle.exito ? detalle.data?.cupoDisponible : null;
      setEvento((actual) => ({ ...actual, cupoDisponible: libres ?? null }));
    })();

    return () => {
      activo = false;
    };
  }, []);

  return { evento, noticias };
}