import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind y resuelve conflictos.
 *   cn("px-4 bg-primary", activo && "bg-navy", className)
 */
export function cn(...clases) {
    return twMerge(clsx(clases));
}