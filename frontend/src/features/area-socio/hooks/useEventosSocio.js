import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import dayjs from "@/shared/utils/fechas";
import { descargarBlob, idValido, nombreArchivoSeguro } from "@/shared/utils/seguridad";
import {
  obtenerEventosSocios,
  obtenerEventosPublicos,
  inscribirseEvento,
  cancelarInscripcion,
  obtenerCertificadoEvento,
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
    proximoEvento, otrosDelDia,
    gestionarInscripcion, descargarCertificado,
  };
}
