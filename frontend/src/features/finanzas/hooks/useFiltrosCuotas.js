import { useMemo, useState } from "react";
import { nombrePeriodo } from "../utils/cuotas";

export const CUOTAS_POR_PAGINA = 10;

const FILTROS_INICIALES = { busqueda: "", periodo: "todos", estado: "todos" };
const soloDigitos = (texto) => String(texto || "").replace(/\D/g, "");

/** Búsqueda + filtros + paginación del listado de cuotas. */
export function useFiltrosCuotas(cuotas) {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [paginaActual, setPaginaActual] = useState(1);

  // Al cambiar un filtro se vuelve a la página 1 (en el handler, sin efectos).
  const cambiar = (campo) => (valor) => {
    setFiltros((previos) => ({ ...previos, [campo]: valor }));
    setPaginaActual(1);
  };
  const limpiar = () => {
    setFiltros(FILTROS_INICIALES);
    setPaginaActual(1);
  };

  const opcionesPeriodo = useMemo(() => {
    const periodos = [...new Set(cuotas.map((c) => c.mes_anio).filter(Boolean))].sort().reverse();
    return [{ valor: "todos", texto: "Todas" }, ...periodos.map((p) => ({ valor: p, texto: nombrePeriodo(p) }))];
  }, [cuotas]);

  const filtradas = useMemo(() => {
    const termino = filtros.busqueda.trim().toLowerCase();
    const digitos = soloDigitos(termino);

    return cuotas.filter((cuota) => {
      const razon = cuota.socio?.razonSocial?.toLowerCase() || "";
      const cuit = cuota.socio?.cuit || "";
      const coincideBusqueda =
        !termino ||
        razon.includes(termino) ||
        cuit.includes(termino) ||
        (digitos && soloDigitos(cuit).includes(digitos));

      return (
        coincideBusqueda &&
        (filtros.periodo === "todos" || cuota.mes_anio === filtros.periodo) &&
        (filtros.estado === "todos" || cuota.estado === filtros.estado)
      );
    });
  }, [cuotas, filtros]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / CUOTAS_POR_PAGINA));
  const pagina = Math.min(paginaActual, totalPaginas); // derivada, nunca se pasa del total
  const visibles = filtradas.slice((pagina - 1) * CUOTAS_POR_PAGINA, pagina * CUOTAS_POR_PAGINA);

  return {
    filtros, cambiar, limpiar, opcionesPeriodo,
    filtradas, visibles, pagina, totalPaginas, setPagina: setPaginaActual,
  };
}
