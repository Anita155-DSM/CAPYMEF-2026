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

/** Datos y acciones del calendario de eventos del socio. */
export function useEventosSocio() {
  const [mesVisible, setMesVisible] = useState(() => dayjs().startOf("month"));
  const [eventos, setEventos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [cupo, setCupo] = useState({ id: null, valor: undefined }); // cupos libres del evento abierto

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
      const primerFuturo = lista.find((e) => !yaTermino(e));
      if (primerFuturo) setMesVisible(dayjs(primerFuturo.fecha).startOf("month"));
      setCargando(false);
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  // Próximo = el primero que todavía no terminó (un evento de hoy cuenta hasta que acaba)
  const proximoEvento = useMemo(
    () => eventos.filter((e) => !yaTermino(e)).sort((a, b) => inicioDelEvento(a).diff(inicioDelEvento(b)))[0] || null,
    [eventos]
  );

  // /eventos/socios no informa cuántos cupos quedan: se pregunta al detalle del evento que se abre
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

  // undefined = consultando · null = sin límite o no se pudo saber · número = cupos libres
  const cupoDisponible = !conLimite ? null : cupo.id === idSeleccionado ? cupo.valor : undefined;

  // Eventos que ocurren el mismo día que el seleccionado
  const otrosDelDia = useMemo(
    () => (seleccionado ? eventos.filter((e) => e.fecha === seleccionado.fecha && e.id !== seleccionado.id) : []),
    [eventos, seleccionado]
  );

  const gestionarInscripcion = async () => {
    if (!seleccionado || procesando) return;
    setProcesando(true);
    const inscribir = !seleccionado.yaInscripto;
    const resultado = inscribir ? await inscribirseEvento(seleccionado.id) : await cancelarInscripcion(seleccionado.id);
    setProcesando(false);

    if (!resultado.exito) {
      toast.error(resultado.mensaje || "No se pudo actualizar la inscripción");
      return;
    }
    setEventos((act) => act.map((e) => (e.id === seleccionado.id ? { ...e, yaInscripto: inscribir } : e)));
    setSeleccionado((act) => ({ ...act, yaInscripto: inscribir }));
    toast.success(resultado.mensaje || (inscribir ? "Inscripción registrada." : "Inscripción cancelada."));
    if (seleccionado.cupoMaximo != null) cargarCupo(seleccionado.id).then((valor) => setCupo({ id: seleccionado.id, valor })); // los cupos cambiaron
  };

  const descargarCertificado = async () => {
    if (!seleccionado || procesando) return;
    if (!idValido(seleccionado.id)) return toast.error("Evento inválido.");

    setProcesando(true);
    const resultado = await obtenerCertificadoEvento(seleccionado.id);
    setProcesando(false);

    if (!resultado.exito) return toast.error(resultado.mensaje || "No se pudo descargar el certificado.");
    descargarBlob(resultado.data, `certificado-${nombreArchivoSeguro(seleccionado.titulo)}.pdf`);
  };

  return {
    eventos, cargando, error, procesando,
    mesVisible, setMesVisible,
    seleccionado, setSeleccionado,
    proximoEvento, otrosDelDia, cupoDisponible,
    gestionarInscripcion, descargarCertificado,
  };
}