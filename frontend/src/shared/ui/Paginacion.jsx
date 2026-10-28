import { cn } from "@/shared/utils/cn";

/**
 * Paginador con números. Muestra una ventana de `maxVisibles` páginas
 * alrededor de la actual y se oculta si hay una sola página.
 */
export default function Paginacion({ pagina, totalPaginas, onCambiar, maxVisibles = 10 }) {
  if (totalPaginas <= 1) return null;

  const inicio = Math.max(1, Math.min(pagina - Math.floor(maxVisibles / 2), totalPaginas - maxVisibles + 1));
  const fin = Math.min(totalPaginas, inicio + maxVisibles - 1);
  const numeros = Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);

  const base = "min-w-8 px-2 py-1 rounded text-sm transition-colors";
  const flecha = cn(base, "font-bold text-primary hover:bg-surface disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed");

  return (
    <nav className="flex items-center justify-center gap-1 mt-6" aria-label="Paginación">
      <button type="button" className={flecha} onClick={() => onCambiar(pagina - 1)} disabled={pagina === 1} aria-label="Página anterior">
        &lt;
      </button>

      {numeros.map((numero) => (
        <button
          key={numero}
          type="button"
          onClick={() => onCambiar(numero)}
          aria-current={numero === pagina ? "page" : undefined}
          className={cn(base, numero === pagina ? "bg-primary text-white font-bold" : "text-primary hover:bg-surface")}
        >
          {numero}
        </button>
      ))}

      <button type="button" className={flecha} onClick={() => onCambiar(pagina + 1)} disabled={pagina === totalPaginas} aria-label="Página siguiente">
        &gt;
      </button>
    </nav>
  );
}
