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
  `inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
    activo
      ? "bg-sidebar text-white shadow-2xs"
      : "text-slate-600 hover:text-navy"
  }`;

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
      {/* Encabezado institucional */}
      <header className="relative overflow-hidden rounded-2xl border border-primary/15 bg-linear-to-r from-white via-white to-surface-blue p-5 shadow-xs sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/6"
        />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Encuentros y Formación
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
              Eventos y capacitaciones
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
              Elegí un día en el calendario o consultá el listado para inscribirte en talleres, conferencias y asambleas.
            </p>
          </div>

          {/* Selector segmentado de vista */}
          <div
            className="inline-flex shrink-0 items-center gap-1 self-start rounded-xl bg-white p-1 shadow-2xs ring-1 ring-slate-200/80 sm:self-end"
            role="group"
            aria-label="Cambiar vista"
          >
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
        </div>
      </header>

      {/* Alerta de error si ocurre alguno */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Contenido principal según estado de carga y vista seleccionada */}
      {cargando ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white py-16 text-center shadow-xs">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sidebar border-t-transparent" />
          <p className="text-sm text-slate-600">Cargando eventos y capacitaciones...</p>
        </div>
      ) : eventos.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white py-16 text-center shadow-xs">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-surface-blue text-2xl text-primary">
            <FaRegCalendarCheck />
          </span>
          <p className="font-semibold text-navy">
            No hay eventos publicados en este momento
          </p>
          <p className="mt-1 text-xs text-slate-500">
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

      {/* Tarjeta destacada del próximo evento abajo del todo */}
      {proximoEvento && (
        <ProximoEventoCard
          evento={proximoEvento}
          onClick={() => setSeleccionado(proximoEvento)}
        />
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
