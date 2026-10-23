import { useReducer, useMemo } from "react";

const filtrosIniciales = { busqueda: "", categoria: "Todas", rubro: "Todas", localidad: "Todas" };

function reducerFiltros(estado, accion) {
  switch (accion.tipo) {
    case "SET_BUSQUEDA": return { ...estado, busqueda: accion.payload };
    case "SET_CATEGORIA": return { ...estado, categoria: accion.payload };
    case "SET_RUBRO": return { ...estado, rubro: accion.payload };
    case "SET_LOCALIDAD": return { ...estado, localidad: accion.payload };
    case "RESETEAR": return filtrosIniciales;
    default: return estado;
  }
}

const valoresUnicos = (lista, campo) => ["Todas", ...new Set(lista.map((s) => s[campo]).filter(Boolean))];

/** Filtros del padrón: devuelve estado, dispatch, lista filtrada y opciones de los selects. */
export function useBuscador(listaOriginal) {
  const [filtros, dispatch] = useReducer(reducerFiltros, filtrosIniciales);

  const opciones = useMemo(
    () => ({
      categorias: valoresUnicos(listaOriginal, "categoria"),
      rubros: valoresUnicos(listaOriginal, "rubro"),
      localidades: valoresUnicos(listaOriginal, "localidad"),
    }),
    [listaOriginal],
  );

  const filtrados = useMemo(() => {
    const termino = filtros.busqueda.toLowerCase();
    return listaOriginal.filter((socio) => {
      const coincideBusqueda =
        socio.cuit?.toLowerCase().includes(termino) ||
        socio.razonSocial?.toLowerCase().includes(termino) ||
        socio.titular?.toLowerCase().includes(termino);

      return (
        coincideBusqueda &&
        (filtros.categoria === "Todas" || socio.categoria === filtros.categoria) &&
        (filtros.rubro === "Todas" || socio.rubro === filtros.rubro) &&
        (filtros.localidad === "Todas" || socio.localidad === filtros.localidad)
      );
    });
  }, [listaOriginal, filtros]);

  return { filtros, dispatch, filtrados, opciones };
}
