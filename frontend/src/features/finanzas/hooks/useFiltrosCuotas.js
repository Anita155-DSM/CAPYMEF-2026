import { useMemo, useState } from "react";
import { nombrePeriodo } from "../utils/cuotas";

export const CUOTAS_POR_PAGINA = 10;

const FILTROS_INICIALES = { busqueda: "", periodo: "todos", estado: "todos", categoria: "todas" };
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
    return [{ valor: "todos", texto: "Todos los períodos" }, ...periodos.map((p) => ({ valor: p, texto: nombrePeriodo(p) }))];
  }, [cuotas]);

  // Primero filtramos por búsqueda, período y categoría para calcular conteos en tiempo real por estado
  const baseSinEstado = useMemo(() => {
    const termino = filtros.busqueda.trim().toLowerCase();
    const digitos = soloDigitos(termino);

    return cuotas.filter((cuota) => {
      const razon = cuota.socio?.razonSocial?.toLowerCase() || "";
      const email = cuota.socio?.email?.toLowerCase() || "";
      const cuit = cuota.socio?.cuit || "";
      const categoriaSocio = (cuota.socio?.categoria || "").toLowerCase();

      const coincideBusqueda =
        !termino ||
        razon.includes(termino) ||
        email.includes(termino) ||
        cuit.includes(termino) ||
        (digitos && soloDigitos(cuit).includes(digitos));

      const coincidePeriodo = filtros.periodo === "todos" || cuota.mes_anio === filtros.periodo;
      const coincideCategoria = filtros.categoria === "todas" || categoriaSocio === filtros.categoria;

      return coincideBusqueda && coincidePeriodo && coincideCategoria;
    });
  }, [cuotas, filtros.busqueda, filtros.periodo, filtros.categoria]);

  const resumen = useMemo(() => {
    let pagadas = 0;
    let pendientes = 0;
    let vencidas = 0;
    let montoRecaudado = 0;
    let montoPendiente = 0;

    for (const c of baseSinEstado) {
      const monto = Number(c.monto) || 0;
      if (c.estado === "pagada") {
        pagadas += 1;
        montoRecaudado += monto;
      } else if (c.estado === "vencida") {
        vencidas += 1;
        montoPendiente += monto;
      } else {
        pendientes += 1;
        montoPendiente += monto;
      }
    }

    return {
      total: baseSinEstado.length,
      pagadas,
      pendientes,
      vencidas,
      montoRecaudado,
      montoPendiente,
    };
  }, [baseSinEstado]);

  const filtradas = useMemo(() => {
    if (filtros.estado === "todos") return baseSinEstado;
    return baseSinEstado.filter((cuota) => cuota.estado === filtros.estado);
  }, [baseSinEstado, filtros.estado]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / CUOTAS_POR_PAGINA));
  const pagina = Math.min(paginaActual, totalPaginas);
  const visibles = filtradas.slice((pagina - 1) * CUOTAS_POR_PAGINA, pagina * CUOTAS_POR_PAGINA);

  return {
    filtros,
    cambiar,
    limpiar,
    opcionesPeriodo,
    resumen,
    filtradas,
    visibles,
    pagina,
    totalPaginas,
    setPagina: setPaginaActual,
  };
}
