import { useEffect, useState } from "react";

/** Índice que avanza solo cada `intervaloMs`. */
export function useCarrusel(cantidad, intervaloMs) {
  const [activo, setActivo] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setActivo((prev) => (prev + 1) % cantidad), intervaloMs);
    return () => window.clearInterval(id);
  }, [cantidad, intervaloMs]);

  return activo;
}
