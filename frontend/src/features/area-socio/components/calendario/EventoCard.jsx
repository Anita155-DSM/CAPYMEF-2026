import {
  FaCalendarDay,
  FaCircleCheck,
  FaClock,
  FaDownload,
  FaLocationDot,
  FaUsers,
  FaVideo,
} from "react-icons/fa6";
import logo from "@/assets/img/logo.png";
import dayjs from "@/shared/utils/fechas";
import { urlImagen } from "@/shared/utils/imagenes";
import { describirLugar, textoCupos, textoHorario, yaTermino } from "../../utils/eventos";

/**
 * Tarjeta individual de evento para la vista en cuadrícula/listado.
 * Comparte el estilo visual de las tarjetas de Noticias (NoticiaHomeCard)
 * y de Mi Empresa (bordes redondeados, paleta institucional, estados visuales claros).
 */
export default function EventoCard({
  evento,
  onSeleccionar,
  onInscripcion,
  onCertificado,
  procesando,
}) {
  const imagen = urlImagen(evento.imagenUrl);
  const fecha = dayjs(evento.fecha);
  const lugar = describirLugar(evento);
  const esVirtual = evento.modalidad === "virtual";
  const IconoLugar = esVirtual ? FaVideo : FaLocationDot;
  const finalizado = yaTermino(evento);

  return (
    <article
      onClick={() => onSeleccionar(evento)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSeleccionar(evento)}
      role="button"
      tabIndex={0}
      aria-label={`Ver evento: ${evento.titulo}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar cursor-pointer"
    >
      {/* Cabecera con imagen o degradado institucional con logo */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        {imagen ? (
          <img
            src={imagen}
            alt={evento.titulo}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy to-primary p-6">
            <img
              src={logo}
              alt="CAPYMEF"
              className="max-h-20 max-w-[55%] object-contain opacity-80 drop-shadow-md"
            />
          </div>
        )}

        {/* Insignias flotantes sobre la imagen */}
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-navy shadow-sm backdrop-blur-xs">
            <IconoLugar className="text-primary text-[11px]" />
            {esVirtual ? "Virtual" : "Presencial"}
          </span>

          {finalizado && (
            <span className="rounded-full bg-gray-900/80 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              Finalizado
            </span>
          )}
        </div>

        {evento.yaInscripto && (
          <div className="absolute right-3 top-3 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
              <FaCircleCheck className="text-[11px]" /> Estás inscripto
            </span>
          </div>
        )}
      </div>

      {/* Contenido descriptivo */}
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

        {/* Metadatos: horario, lugar, cupos */}
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

        {/* Acciones al pie */}
        <div className="mt-5 flex items-center justify-between gap-2 border-t border-gray-100 pt-4">
          <span className="text-xs font-bold text-primary group-hover:underline">
            Ver detalle completo
          </span>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {finalizado ? (
              evento.yaInscripto && (
                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => onCertificado(evento)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:opacity-60"
                  title="Descargar certificado de asistencia"
                >
                  <FaDownload /> Certificado
                </button>
              )
            ) : (
              <button
                type="button"
                disabled={procesando}
                onClick={() => onInscripcion(evento)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  evento.yaInscripto
                    ? "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                    : "bg-primary text-white shadow-xs hover:bg-primary-dark"
                }`}
              >
                {evento.yaInscripto ? "Cancelar" : "Inscribirme"}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

