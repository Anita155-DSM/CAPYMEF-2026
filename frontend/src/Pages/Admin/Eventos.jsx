import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCalendarDay,
  FaCalendarDays,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaListUl,
  FaLocationDot,
  FaPenToSquare,
  FaPlus,
  FaRegCalendarCheck,
  FaUsers,
  FaVideo,
} from "react-icons/fa6";
import logo from "@/assets/img/logo.png";
import dayjs from "@/shared/utils/fechas";
import { urlImagen } from "@/shared/utils/imagenes";
import { obtenerEventosSocios } from "@/services/eventosService";
import {
  describirLugar,
  textoCupos,
  textoHorario,
  yaTermino,
} from "@/features/area-socio/utils/eventos";
import EventoFormModal from "@/features/eventos/components/EventoFormModal";
import InscriptosEventoModal from "@/features/eventos/components/InscriptosEventoModal";

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const claseVista = (activo) =>
  `inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
    activo ? "bg-sidebar text-white shadow-2xs" : "text-slate-600 hover:text-navy"
  }`;

export default function EventosAdmin() {
  const [mesVisible, setMesVisible] = useState(() => dayjs().startOf("month"));
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [modalFormAbierto, setModalFormAbierto] = useState(false);
  const [modoModal, setModoModal] = useState("crear");
  const [eventoInscriptos, setEventoInscriptos] = useState(null);
  const [vista, setVista] = useState("calendario"); // "calendario" | "tarjetas"

  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarEventos = useCallback(async () => {
    setCargando(true);
    setError("");
    const result = await obtenerEventosSocios();
    if (result.exito) {
      const lista = Array.isArray(result.data) ? result.data : [];
      setEventos(lista);
      setEventoSeleccionado((prev) =>
        prev ? lista.find((e) => e.id === prev.id) || null : null
      );
    } else {
      setError(result.mensaje || "No se pudieron cargar los eventos.");
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  const hoy = dayjs();

  const celdasCalendario = useMemo(() => {
    const huecos = (mesVisible.startOf("month").day() + 6) % 7;
    return [
      ...Array(huecos).fill(null),
      ...Array.from({ length: mesVisible.daysInMonth() }, (_, i) => i + 1),
    ];
  }, [mesVisible]);

  const eventosDelDia = useCallback(
    (dia) => {
      if (!dia) return [];
      const fechaStr = mesVisible.date(dia).format("YYYY-MM-DD");
      return eventos.filter((e) => e.fecha && e.fecha.split("T")[0] === fechaStr);
    },
    [eventos, mesVisible]
  );

  const eventosFechaSeleccionada = useMemo(() => {
    if (!fechaSeleccionada) return [];
    const fechaStr = fechaSeleccionada.format("YYYY-MM-DD");
    return eventos.filter((e) => e.fecha && e.fecha.split("T")[0] === fechaStr);
  }, [eventos, fechaSeleccionada]);

  const handleSeleccionarDia = (dia) => {
    if (!dia) return;
    const fechaExacta = mesVisible.date(dia);
    const delDia = eventosDelDia(dia);

    if (fechaSeleccionada && fechaSeleccionada.isSame(fechaExacta, "day")) {
      setFechaSeleccionada(null);
      setEventoSeleccionado(null);
    } else {
      setFechaSeleccionada(fechaExacta);
      setEventoSeleccionado(delDia[0] || null);
    }
  };

  const abrirCrear = (fechaPredef = fechaSeleccionada) => {
    if (fechaPredef) setFechaSeleccionada(fechaPredef);
    setModoModal("crear");
    setModalFormAbierto(true);
  };

  const abrirEditar = (evento) => {
    setEventoSeleccionado(evento);
    if (evento?.fecha) setFechaSeleccionada(dayjs(evento.fecha));
    setModoModal("editar");
    setModalFormAbierto(true);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado institucional idéntico a Socio */}
      <header className="relative overflow-hidden rounded-none border border-primary/15 bg-linear-to-r from-white via-white to-surface-blue p-5 shadow-xs sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/6"
        />
        <div className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Agenda Institucional
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
              Eventos y capacitaciones
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
              Elegí un día en el calendario o consultá el listado para programar actividades, gestionar inscriptos y emitir certificados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
            {/* Selector segmentado de vista (Calendario | Listado) igual que en Socio */}
            <div
              className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-white p-1 shadow-2xs ring-1 ring-slate-200/80"
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

            {eventoSeleccionado && (
              <>
                <button
                  type="button"
                  onClick={() => setEventoInscriptos(eventoSeleccionado)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-primary/25 bg-white px-4 py-2.5 text-xs font-semibold text-primary shadow-2xs transition-colors hover:bg-surface-blue sm:text-sm"
                >
                  <FaUsers /> Inscriptos
                </button>
                <button
                  type="button"
                  onClick={() => abrirEditar(eventoSeleccionado)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-primary/25 bg-white px-4 py-2.5 text-xs font-semibold text-primary shadow-2xs transition-colors hover:bg-surface-blue sm:text-sm"
                >
                  <FaPenToSquare /> Editar evento
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => abrirCrear(fechaSeleccionada)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-dark sm:text-sm"
            >
              <FaPlus /> Crear evento
            </button>
          </div>
        </div>
      </header>

      {/* Alerta de error si ocurre alguno */}
      {error && (
        <div className="rounded-none border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Contenido principal con el mismo estado de carga y calendario que Socio */}
      {cargando ? (
        <div className="rounded-none border border-slate-200/90 bg-white py-16 text-center shadow-xs">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sidebar border-t-transparent" />
          <p className="text-sm text-slate-600">Cargando eventos y capacitaciones...</p>
        </div>
      ) : vista === "calendario" ? (
        <div className="overflow-hidden rounded-none border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          {/* Barra superior de mes y controles de navegación idéntica a CalendarioEventos.jsx */}
          <div className="flex items-center justify-between border-b-2 border-primary/20 pb-2.5 text-primary">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() => setMesVisible((m) => m.subtract(1, "month"))}
              className="cursor-pointer rounded-lg p-2 text-primary transition-colors hover:bg-surface-blue"
            >
              <FaChevronLeft className="text-base" />
            </button>

            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold uppercase tracking-wide text-navy sm:text-2xl">
                {mesVisible.format("MMMM")}
              </h2>
              <span className="text-xl font-semibold text-primary sm:text-2xl">
                {mesVisible.format("YYYY")}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMesVisible(dayjs().startOf("month"))}
                className="hidden cursor-pointer rounded-md border border-gray-200 px-2.5 py-1 text-xs font-bold text-gray-600 transition-colors hover:bg-surface-blue hover:text-primary sm:inline-block"
                title="Volver al mes actual"
              >
                Hoy
              </button>

              <button
                type="button"
                aria-label="Mes siguiente"
                onClick={() => setMesVisible((m) => m.add(1, "month"))}
                className="cursor-pointer rounded-lg p-2 text-primary transition-colors hover:bg-surface-blue"
              >
                <FaChevronRight className="text-base" />
              </button>
            </div>
          </div>

          {/* Cabecera de días de la semana */}
          <div className="grid grid-cols-7 pt-3 text-center text-xs font-bold uppercase tracking-wider text-primary sm:text-sm">
            {DIAS_SEMANA.map((d) => (
              <span key={d} className="truncate">
                <span className="sm:hidden">{d.slice(0, 3)}</span>
                <span className="hidden sm:inline">{d}</span>
              </span>
            ))}
          </div>

          {/* Grilla de días mensual */}
          <div className="grid grid-cols-7 border-b border-gray-100 pb-3 pt-1">
            {celdasCalendario.map((dia, i) => {
              const delDia = eventosDelDia(dia);
              const esHoy = Boolean(dia) && mesVisible.date(dia).isSame(hoy, "day");
              const esSeleccionado =
                Boolean(dia) &&
                Boolean(fechaSeleccionada) &&
                mesVisible.date(dia).isSame(fechaSeleccionada, "day");
              const tieneEventos = delDia.length > 0;
              const terminados = tieneEventos && delDia.every(yaTermino);

              let claseNumero =
                "flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-xs sm:text-sm transition-colors";
              if (tieneEventos) {
                claseNumero += ` font-bold text-white ${
                  terminados ? "bg-gray-400" : "bg-primary shadow-xs"
                }`;
              } else {
                claseNumero += " text-navy font-medium";
              }

              if (esHoy) {
                claseNumero +=
                  " ring-2 ring-primary ring-offset-2 ring-offset-white font-bold";
                if (!tieneEventos) claseNumero += " bg-surface-blue text-primary";
              }

              return (
                <button
                  type="button"
                  key={`${dia || "vacio"}-${i}`}
                  disabled={!dia}
                  onClick={() => handleSeleccionarDia(dia)}
                  aria-label={
                    dia
                      ? `${dia} de ${mesVisible.format("MMMM")}${
                          delDia.length ? `: ${delDia.map((e) => e.titulo).join(", ")}` : ""
                        }${esHoy ? " (hoy)" : ""}`
                      : undefined
                  }
                  className={`flex min-h-[62px] flex-col items-center justify-start px-1 pt-1.5 transition-colors sm:min-h-[72px] ${
                    !dia
                      ? "cursor-default opacity-0"
                      : esSeleccionado
                      ? "cursor-pointer rounded-lg bg-surface-blue ring-1 ring-primary/40"
                      : tieneEventos
                      ? "cursor-pointer rounded-lg hover:bg-surface-blue/60"
                      : "cursor-pointer rounded-lg hover:bg-gray-50/80"
                  }`}
                >
                  <span className={claseNumero}>{dia || ""}</span>

                  {tieneEventos && (
                    <div className="mt-1 flex w-full flex-col items-center">
                      <span
                        className={`w-full truncate text-center text-[10px] font-semibold leading-tight sm:text-[11px] ${
                          terminados ? "text-gray-500" : "text-navy"
                        }`}
                        title={delDia[0].titulo}
                      >
                        {delDia[0].titulo}
                      </span>

                      {delDia.length > 1 && (
                        <span className="mt-0.5 text-[10px] font-bold text-primary">
                          +{delDia.length - 1} más
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selector rápido si la fecha elegida tiene más de un evento */}
          {eventosFechaSeleccionada.length > 1 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
              <span className="text-xs font-bold text-navy">
                Eventos del {fechaSeleccionada.format("DD/MM")}:
              </span>
              {eventosFechaSeleccionada.map((evt) => (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => setEventoSeleccionado(evt)}
                  className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                    eventoSeleccionado?.id === evt.id
                      ? "bg-primary text-white shadow-2xs"
                      : "border border-gray-200 bg-surface text-navy hover:bg-surface-blue"
                  }`}
                >
                  {evt.titulo}
                </button>
              ))}
            </div>
          )}

          {/* Leyenda de referencias idéntica a CalendarioEventos.jsx */}
          <div className="mt-3.5 flex flex-col gap-2 pt-1 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-primary" /> Evento programado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-gray-400" /> Finalizado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border-2 border-primary bg-white" /> Día de hoy
              </span>
            </div>

            <p className="text-[11px] text-gray-500">
              {fechaSeleccionada
                ? `Fecha seleccionada: ${fechaSeleccionada.format("DD/MM/YYYY")}`
                : "Tocá cualquier día para programar un evento o gestionar los existentes."}
            </p>
          </div>
        </div>
      ) : eventos.length === 0 ? (
        <div className="rounded-none border border-slate-200/90 bg-white py-16 text-center shadow-xs">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-surface-blue text-2xl text-primary">
            <FaRegCalendarCheck />
          </span>
          <p className="font-semibold text-navy">
            No hay eventos publicados en este momento
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Usá el botón "Crear evento" para programar una nueva actividad institucional.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {eventos.map((evento) => {
            const imagen = urlImagen(evento.imagenUrl);
            const fecha = dayjs(evento.fecha);
            const lugar = describirLugar(evento);
            const esVirtual = evento.modalidad === "virtual";
            const IconoLugar = esVirtual ? FaVideo : FaLocationDot;
            const finalizado = yaTermino(evento);

            return (
              <article
                key={evento.id}
                onClick={() => abrirEditar(evento)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && abrirEditar(evento)}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-none border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  {imagen ? (
                    <img
                      src={imagen}
                      alt={evento.titulo}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-navy to-primary p-6">
                      <img
                        src={logo}
                        alt="CAPYMEF"
                        className="max-h-20 max-w-[55%] object-contain opacity-80 drop-shadow-md"
                      />
                    </div>
                  )}

                  <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-navy shadow-sm backdrop-blur-xs">
                      <IconoLugar className="text-[11px] text-primary" />
                      {esVirtual ? "Virtual" : "Presencial"}
                    </span>

                    {finalizado && (
                      <span className="rounded-full bg-gray-900/80 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                        Finalizado
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    <FaCalendarDay />
                    <span>{fecha.format("dddd D [de] MMMM, YYYY")}</span>
                  </div>

                  <h3 className="line-clamp-2 text-lg font-bold leading-snug text-navy transition-colors group-hover:text-primary">
                    {evento.titulo}
                  </h3>

                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-gray-600">
                    {evento.descripcion || "Sin descripción disponible."}
                  </p>

                  <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-3 text-xs text-gray-600">
                    <p className="flex items-center gap-2">
                      <FaClock className="shrink-0 text-primary" /> {textoHorario(evento)}
                    </p>
                    <p className="flex items-center gap-2 truncate" title={lugar.texto}>
                      <IconoLugar className="shrink-0 text-primary" />
                      <span className="truncate">{lugar.texto}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <FaUsers className="shrink-0 text-primary" /> {textoCupos(evento)}
                    </p>
                  </div>

                  <div
                    className="mt-5 flex items-center justify-between gap-2 border-t border-gray-100 pt-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setEventoInscriptos(evento)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary/25 bg-surface-blue px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                      <FaUsers className="text-[11px]" /> Inscriptos
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirEditar(evento)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-primary-dark"
                    >
                      <FaPenToSquare className="text-[11px]" /> Editar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal de creación / edición de evento (con el mismo estilo de Socio) */}
      {modalFormAbierto && (
        <EventoFormModal
          onClose={() => setModalFormAbierto(false)}
          modo={modoModal}
          fechaPredefinida={fechaSeleccionada}
          eventoExistente={modoModal === "editar" ? eventoSeleccionado : null}
          onActualizado={cargarEventos}
          onVerInscriptos={(evt) => setEventoInscriptos(evt)}
        />
      )}

      {/* Modal de gestión de inscriptos, asistencia y certificados */}
      {eventoInscriptos && (
        <InscriptosEventoModal
          evento={eventoInscriptos}
          onClose={() => setEventoInscriptos(null)}
          onEditar={() => {
            const evt = eventoInscriptos;
            setEventoInscriptos(null);
            abrirEditar(evt);
          }}
        />
      )}
    </div>
  );
}
