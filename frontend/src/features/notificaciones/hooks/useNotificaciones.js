import { useCallback, useEffect, useState } from "react";
import {
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  obtenerContadorNotificaciones,
  obtenerNotificaciones,
} from "@/services/notificacionesServices";

const INTERVALO_CONTADOR_MS = 60_000;

/**
 * Notificaciones del usuario logueado.
 *  - `noLeidas` se refresca solo cada minuto (globito de la campana).
 *  - El listado se pide con `cargar()` (al abrir el panel) y `cargarMas()`.
 */
export function useNotificaciones() {
  const [items, setItems] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Contador de la campana: primera lectura + refresco periódico.
  useEffect(() => {
    let activo = true;
    const aplicar = (resultado) => {
      if (activo && resultado.exito) setNoLeidas(resultado.noLeidas ?? 0);
    };
    // Solo se consulta con la pestaña visible; al volver a ella se actualiza al instante.
    const refrescar = () => {
      if (document.visibilityState === "visible") obtenerContadorNotificaciones().then(aplicar);
    };
    refrescar();
    const id = setInterval(refrescar, INTERVALO_CONTADOR_MS);
    document.addEventListener("visibilitychange", refrescar);
    return () => {
      activo = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", refrescar);
    };
  }, []);

  const cargarPagina = useCallback(async (numero) => {
    setCargando(true);
    setError("");
    const resultado = await obtenerNotificaciones({ page: numero });
    if (resultado.exito && Array.isArray(resultado.data)) {
      setItems((previas) => (numero === 1 ? resultado.data : [...previas, ...resultado.data]));
      setNoLeidas(resultado.noLeidas ?? 0);
      setPagina(numero);
      setTotalPaginas(resultado.totalPaginas ?? 0);
    } else {
      setError(resultado.mensaje || "No se pudieron cargar tus notificaciones.");
    }
    setCargando(false);
  }, []);

  const cargar = useCallback(() => cargarPagina(1), [cargarPagina]);
  const cargarMas = useCallback(() => cargarPagina(pagina + 1), [cargarPagina, pagina]);

  const marcarLeida = useCallback(
    async (notificacion) => {
      if (notificacion.leida) return;
      // Optimista: se ve al instante; si el backend falla, se vuelve a pedir la lista.
      setItems((previas) => previas.map((n) => (n.id === notificacion.id ? { ...n, leida: true } : n)));
      setNoLeidas((cantidad) => Math.max(0, cantidad - 1));
      const resultado = await marcarNotificacionLeida(notificacion.id);
      if (!resultado.exito) cargarPagina(1);
    },
    [cargarPagina],
  );

  const marcarTodasLeidas = useCallback(async () => {
    const resultado = await marcarTodasNotificacionesLeidas();
    if (resultado.exito) {
      setItems((previas) => previas.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
    }
    return resultado;
  }, []);

  return {
    items, noLeidas, cargando, error,
    hayMas: pagina < totalPaginas,
    cargar, cargarMas, marcarLeida, marcarTodasLeidas,
  };
}