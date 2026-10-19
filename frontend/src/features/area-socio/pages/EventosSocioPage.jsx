import { useEventosSocio } from "../hooks/useEventosSocio";
import CalendarioEventos from "../components/CalendarioEventos";
import ProximoEventoCard from "../components/ProximoEventoCard";
import EventoDetalleModal from "../components/EventoDetalleModal";

export default function EventosSocioPage() {
  const {
    eventos, cargando, error, procesando,
    mesVisible, setMesVisible,
    seleccionado, setSeleccionado,
    proximoEvento, otrosDelDia,
    gestionarInscripcion, descargarCertificado,
  } = useEventosSocio();

  return (
    <section className="min-h-[calc(100vh-9rem)] bg-[#edf7fd] px-1 py-2 sm:px-3 sm:py-5">
      <div className="mb-5 flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-normal uppercase text-[#073d6f] sm:text-[25px]">Próximos eventos y capacitaciones</h1>
          <p className="mt-1 text-sm text-[#6b7884]">Elegí un día en el calendario para ver el evento programado para esa fecha.</p>
        </div>
        {proximoEvento && <ProximoEventoCard evento={proximoEvento} onClick={() => setSeleccionado(proximoEvento)} />}
      </div>

      {error && <div className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {cargando ? (
        <p className="py-12 text-center text-sm text-gray-600">Cargando eventos...</p>
      ) : (
        <CalendarioEventos mes={mesVisible} onCambiarMes={setMesVisible} eventos={eventos} onSeleccionar={setSeleccionado} />
      )}

      {seleccionado && (
        <EventoDetalleModal
          evento={seleccionado}
          otros={otrosDelDia}
          procesando={procesando}
          onInscripcion={gestionarInscripcion}
          onCertificado={descargarCertificado}
          onSeleccionar={setSeleccionado}
          onClose={() => setSeleccionado(null)}
        />
      )}
    </section>
  );
}
