import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCalendarCheck,
  FaClock,
  FaLocationDot,
  FaVideo,
} from "react-icons/fa6";
import dayjs from "@/shared/utils/fechas";
import EventoDetalleModal from "../calendario/EventoDetalleModal";
import { describirLugar, textoHorario } from "../../utils/eventos";

/**
 * Próximo evento en el Inicio del socio.
 * Tamaño compacto (sm:w-96, altura natural sin estirarse), con cabecera unificada
 * de Inicio ("Ver todos ->") y apertura directa del modal del evento al hacer clic.
 */
export default function TarjetaProximoEvento({ estado }) {
  const {
    cargando,
    error,
    datos: evento,
    cupoDisponible,
    procesando,
    gestionarInscripcion,
  } = estado;
  const [modalAbierto, setModalAbierto] = useState(false);

  const lugar = evento ? describirLugar(evento) : null;
  const IconoLugar = evento?.modalidad === "virtual" ? FaVideo : FaLocationDot;

  let contenido;
  if (cargando) {
    contenido = (
      <div className="rounded-xl bg-surface p-5 text-sm text-slate-500">
        Cargando eventos...
      </div>
    );
  } else if (error) {
    contenido = (
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </p>
    );
  } else if (!evento) {
    contenido = (
      <p className="py-3 text-sm text-slate-500">
        No hay próximos eventos publicados.
      </p>
    );
  } else {
    const fecha = dayjs(evento.fecha);

    contenido = (
      <button
        type="button"
        onClick={() => setModalAbierto(true)}
        className="group block w-full cursor-pointer text-left"
      >
        <div className="flex items-start gap-3.5">
          {/* Bloque de fecha con estilo institucional CAPYMEF */}
          <div className="shrink-0 rounded-xl bg-primary px-3 py-2 text-center font-bold text-white shadow-xs">
            <span className="block text-[11px] uppercase tracking-wide">
              {fecha.format("MMM").replace(".", "")}
            </span>
            <span className="text-xl leading-none">{fecha.date()}</span>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h3
              className="truncate text-sm font-bold text-navy transition-colors group-hover:text-primary sm:text-base"
              title={evento.titulo}
            >
              {evento.titulo}
            </h3>

            <p className="flex items-center gap-2 text-xs text-gray-600">
              <FaClock className="shrink-0 text-primary" /> {textoHorario(evento)}
            </p>

            <p
              className="flex items-center gap-2 truncate text-xs text-gray-600"
              title={lugar.texto}
            >
              <IconoLugar className="shrink-0 text-primary" />
              <span className="truncate">{lugar.texto}</span>
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex w-full items-center justify-between border-t border-slate-100 pt-2.5 text-xs font-bold text-primary">
          <span>
            {evento.yaInscripto
              ? "Ver información y ubicación"
              : "Ver detalle e inscribirme"}
          </span>
          <FaArrowRight className="transition-transform group-hover:translate-x-1" />
        </div>
      </button>
    );
  }

  return (
    <section className="flex h-full w-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-blue text-sm text-primary">
            <FaCalendarCheck />
          </span>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy">
            Próximo evento
          </h2>
        </div>

        <Link
          to="/socios/eventos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary-dark hover:underline sm:text-sm"
        >
          Ver todos <FaArrowRight className="text-xs" />
        </Link>
      </div>

      <div>{contenido}</div>

      {modalAbierto && evento && (
        <EventoDetalleModal
          evento={evento}
          procesando={procesando}
          cupoDisponible={cupoDisponible}
          onInscripcion={gestionarInscripcion}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </section>
  );
}
