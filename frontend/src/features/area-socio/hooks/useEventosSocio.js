import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import dayjs from "@/shared/utils/fechas";
import { descargarBlob, idValido, nombreArchivoSeguro } from "@/shared/utils/seguridad";
import {
  obtenerDetalleEvento,
  obtenerEventosSocios,
  obtenerEventosPublicos,
  inscribirseEvento,
  cancelarInscripcion,
  obtenerCertificadoEvento,
} from "@/services/eventosService";
import { inicioDelEvento, yaTermino } from "../utils/eventos";

const noCancelado = (e) => e.estado !== "cancelado";

/**
 * Hook para la sección de Eventos y Capacitaciones del socio.
 * Gestiona la carga de eventos, vista activa (calendario / listado),
 * consulta de cupos, inscripciones y descarga del certificado en PDF.
 */
export function useEventosSocio() {
  const [mesVisible, setMesVisible] = useState(() => dayjs().startOf("month"));
  const [eventos, setEventos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [cupo, setCupo] = useState({ id: null, valor: undefined });
  const [vista, setVista] = useState("calendario"); // "calendario" | "tarjetas"

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const resultado = await obtenerEventosSocios();
      if (cancelado) return;

      if (!resultado.exito) {
        setError(resultado.mensaje || "Error al cargar los eventos.");
        setCargando(false);
        return;
      }

      let lista = (resultado.data || []).filter(noCancelado);

      // Si no vinieran eventos para socios, intentamos obtener los públicos
      if (!lista.length) {
        const publicos = await obtenerEventosPublicos();
        if (cancelado) return;
        if (publicos.exito) lista = (publicos.data || []).filter(noCancelado);
      }

      setEventos(lista);

      // Centrar el calendario en el primer evento futuro
      const primerFuturo = lista.find((e) => !yaTermino(e));
      if (primerFuturo) {
        setMesVisible(dayjs(primerFuturo.fecha).startOf("month"));
      }
      setCargando(false);
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  // Próximo evento programado más cercano
  const proximoEvento = useMemo(
    () =>
      eventos
        .filter((e) => !yaTermino(e))
        .sort((a, b) => inicioDelEvento(a).diff(inicioDelEvento(b)))[0] || null,
    [eventos]
  );

  // Consulta de cupos disponibles mediante GET /api/eventos/:id
  const cargarCupo = useCallback(async (id) => {
    const resultado = await obtenerDetalleEvento(id);
    return resultado.exito ? resultado.data?.cupoDisponible ?? null : null;
  }, []);

  const idSeleccionado = seleccionado?.id;
  const conLimite = seleccionado?.cupoMaximo != null;
  useEffect(() => {
    if (!idSeleccionado || !conLimite) return undefined;
    let activo = true;
    cargarCupo(idSeleccionado).then((valor) => activo && setCupo({ id: idSeleccionado, valor }));
    return () => {
      activo = false;
    };
  }, [idSeleccionado, conLimite, cargarCupo]);

  const cupoDisponible = !conLimite ? null : cupo.id === idSeleccionado ? cupo.valor : undefined;

  // Otros eventos que se realizan en la misma fecha
  const otrosDelDia = useMemo(
    () => (seleccionado ? eventos.filter((e) => e.fecha === seleccionado.fecha && e.id !== seleccionado.id) : []),
    [eventos, seleccionado]
  );

  /**
   * Inscripción o cancelación de inscripción para el socio logueado.
   */
  const gestionarInscripcion = async (eventoObjetivo) => {
    const ev = eventoObjetivo || seleccionado;
    if (!ev || procesando) return;

    setProcesando(true);
    const inscribir = !ev.yaInscripto;
    const resultado = inscribir ? await inscribirseEvento(ev.id) : await cancelarInscripcion(ev.id);
    setProcesando(false);

    if (!resultado.exito) {
      toast.error(resultado.mensaje || "No se pudo actualizar la inscripción.");
      return;
    }

    setEventos((act) =>
      act.map((e) => (e.id === ev.id ? { ...e, yaInscripto: inscribir } : e))
    );

    if (seleccionado?.id === ev.id) {
      setSeleccionado((act) => ({ ...act, yaInscripto: inscribir }));
    }

    toast.success(
      resultado.mensaje || (inscribir ? "Inscripción registrada con éxito." : "Inscripción cancelada.")
    );

    if (ev.cupoMaximo != null) {
      cargarCupo(ev.id).then((valor) => setCupo({ id: ev.id, valor }));
    }
  };

  /**
   * Descarga segura del certificado en PDF.
   */
  const descargarCertificado = async (eventoObjetivo) => {
    const ev = eventoObjetivo || seleccionado;
    if (!ev || procesando) return;
    if (!idValido(ev.id)) return toast.error("Evento no válido.");

    setProcesando(true);
    const resultado = await obtenerCertificadoEvento(ev.id);
    setProcesando(false);

    if (!resultado.exito) {
      return toast.error(
        resultado.mensaje || "No se pudo descargar el certificado. Verificá que la asistencia esté confirmada."
      );
    }

    descargarBlob(resultado.data, `certificado-${nombreArchivoSeguro(ev.titulo)}.pdf`);
    toast.success("Certificado descargado con éxito.");
  };

  return {
    eventos,
    cargando,
    error,
    procesando,
    mesVisible,
    setMesVisible,
    seleccionado,
    setSeleccionado,
    proximoEvento,
    otrosDelDia,
    cupoDisponible,
    vista,
    setVista,
    gestionarInscripcion,
    descargarCertificado,
  };
}
