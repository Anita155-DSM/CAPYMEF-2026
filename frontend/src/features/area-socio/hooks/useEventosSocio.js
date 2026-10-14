import { useEffect, useMemo, useState } from "react";
import dayjs from "@/shared/utils/fechas";
import {
  obtenerEventosSocios,
  obtenerEventosPublicos,
  inscribirseEvento,
  cancelarInscripcion,
} from "@/services/eventosService";

const noCancelado = (e) => e.estado !== "cancelado";
const instante = (e) => dayjs(`${e.fecha}T${e.horaInicio || "00:00"}`);

/** Datos y acciones del calendario de eventos del socio. */
export function useEventosSocio() {
  const [mesVisible, setMesVisible] = useState(() => dayjs().startOf("month"));
  const [eventos, setEventos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const resultado = await obtenerEventosSocios();
      if (cancelado) return;

      if (!resultado.exito) {
        setError(resultado.mensaje || "Error al cargar los eventos");
        setCargando(false);
        return;
      }

      let lista = (resultado.data || []).filter(noCancelado);

      // Sin eventos para socios → se muestran los públicos
      if (!lista.length) {
        const publicos = await obtenerEventosPublicos();
        if (cancelado) return;
        if (publicos.exito) lista = (publicos.data || []).filter(noCancelado);
      }

      setEventos(lista);

      // Centrar el calendario en el primer evento futuro
      const primerFuturo = lista.find((e) => dayjs(e.fecha).isSameOrAfter(dayjs(), "day"));
      if (primerFuturo) setMesVisible(dayjs(primerFuturo.fecha).startOf("month"));
      setCargando(false);
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  const proximoEvento = useMemo(() => {
    const hoy = dayjs();
    return (
      eventos
        .filter((e) => dayjs(e.fecha).isSameOrAfter(hoy, "day"))
        .sort((a, b) => instante(a).diff(instante(b)))[0] || null
    );
  }, [eventos]);

  const gestionarInscripcion = async () => {
    if (!seleccionado) return;
    setProcesando(true);
    const resultado = seleccionado.yaInscripto
      ? await cancelarInscripcion(seleccionado.id)
      : await inscribirseEvento(seleccionado.id);
    setProcesando(false);

    if (!resultado.exito) {
      setError(resultado.mensaje || "No se pudo actualizar la inscripción");
      return;
    }
    setEventos((act) => act.map((e) => (e.id === seleccionado.id ? { ...e, yaInscripto: !e.yaInscripto } : e)));
    setSeleccionado((act) => ({ ...act, yaInscripto: !act.yaInscripto }));
  };

  return {
    eventos, cargando, error, procesando,
    mesVisible, setMesVisible,
    seleccionado, setSeleccionado,
    proximoEvento, gestionarInscripcion,
  };
}
