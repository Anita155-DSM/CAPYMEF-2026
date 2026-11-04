import {
  FaCalendarDays,
  FaListUl,
  FaRegCalendarCheck,
} from "react-icons/fa6";
import { useEventosSocio } from "../hooks/useEventosSocio";
import CalendarioEventos from "../components/calendario/CalendarioEventos";
import ProximoEventoCard from "../components/calendario/ProximoEventoCard";
import EventoCard from "../components/calendario/EventoCard";
import EventoDetalleModal from "../components/calendario/EventoDetalleModal";

const claseVista = (activo) =>
  `inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
    activo
      ? "bg-sidebar text-white shadow-sm"
      : "border border-gray-200 bg-white text-sidebar hover:bg-surface-blue"
  }`;

/**
 * Página de Eventos y Capacitaciones del socio.
 * Estilo visual estandarizado con el sistema de diseño CAPYMEF:
 * - Encabezado limpio con selector de vista (Calendario / Listado) integrado a la derecha.
 * - Sin espacios en blanco sobrantes.
 * - Modal detallado con visualización completa del afiche/flyer.
 */
export default function EventosSocioPage() {
  const {
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
  } = useEventosSocio();

  return (
    <div className="space-y-6">
      {/* Encabezado: Título a la izquierda y botones de vista alineados a la derecha */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm font-semibold text-primary">ENCUENTROS Y FORMACIÓN</p>
          <h1 className="text-2xl font-semibold uppercase tracking-tight text-navy sm:text-3xl">
            Eventos y capacitaciones
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-600">
            Elegí un día en el calendario o consultá el listado para enterarte de los talleres, conferencias y asambleas.
          </p>
        </div>

        {/* Selector de vista directamente en la cabecera */}
        <div className="flex shrink-0 items-center gap-2 self-start sm:self-end" role="group" aria-label="Cambiar vista">
          <button
            type="button"
            onClick={() => setVista("calendario")}
            className={claseVista(vista === "calendario")}
            title="Ver calendario mensual"
          >
            <FaCalendarDays /> Calendario
          </button>

          <button
            type="button"
            onClick={() => setVista("tarjetas")}
            className={claseVista(vista === "tarjetas")}
            title="Ver listado de eventos"
          >
            <FaListUl /> Listado
          </button>
        </div>
      </header>

      {/* Alerta de error si ocurre alguno */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tarjeta destacada del próximo evento si existe */}
      {proximoEvento && (
        <ProximoEventoCard
          evento={proximoEvento}
          onClick={() => setSeleccionado(proximoEvento)}
        />
      )}

      {/* Contenido principal según estado de carga y vista seleccionada */}
      {cargando ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sidebar border-t-transparent" />
          <p className="text-sm text-gray-600">Cargando eventos y capacitaciones...</p>
        </div>
      ) : eventos.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <FaRegCalendarCheck className="mx-auto mb-3 text-4xl text-gray-400" />
          <p className="font-semibold text-gray-700">
            No hay eventos publicados en este momento.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Revisá periódicamente esta sección para enterarte de nuevas fechas y convocatorias.
          </p>
        </div>
      ) : vista === "calendario" ? (
        <CalendarioEventos
          mes={mesVisible}
          onCambiarMes={setMesVisible}
          eventos={eventos}
          onSeleccionar={setSeleccionado}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {eventos.map((evento) => (
            <EventoCard
              key={evento.id}
              evento={evento}
              onSeleccionar={setSeleccionado}
              onInscripcion={gestionarInscripcion}
              onCertificado={descargarCertificado}
              procesando={procesando}
            />
          ))}
        </div>
      )}

      {/* Modal detallado del evento */}
      {seleccionado && (
        <EventoDetalleModal
          evento={seleccionado}
          otros={otrosDelDia}
          procesando={procesando}
          cupoDisponible={cupoDisponible}
          onInscripcion={gestionarInscripcion}
          onCertificado={descargarCertificado}
          onSeleccionar={setSeleccionado}
          onClose={() => setSeleccionado(null)}
        />
      )}
    </div>
  );
}
