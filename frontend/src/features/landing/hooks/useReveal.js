import { useEffect } from "react";

/**
 * Agrega la clase "is-visible" a cada `.inicio-reveal` cuando entra en pantalla.
 * `clave` fuerza a re-observar cuando cambia contenido (p. ej. al llegar las noticias).
 */
export function useReveal(clave) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    document.querySelectorAll(".inicio-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [clave]);
}
