import { useEffect } from "react";

/**
 * Bloquea el scroll de la página mientras `activo` sea true
 * (útil para modales). Al desactivarse o desmontarse, lo restaura.
 */
export function useBloquearScroll(activo = true) {
  useEffect(() => {
    if (!activo) return undefined;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [activo]);
}
