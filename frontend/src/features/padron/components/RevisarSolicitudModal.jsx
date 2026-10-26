import { useState } from "react";
import { FaCheck, FaBan, FaExpand, FaCompress, FaTimes } from "react-icons/fa";
import VisorConstancia from "./VisorConstancia";

const chip = "text-xs sm:text-sm text-gray-300 bg-white/10 px-2 py-1 rounded break-all";

/** Renderizar solo con socio: {socio && <RevisarSolicitudModal … />} */
export default function RevisarSolicitudModal({ socio, onClose, onDecision, procesando }) {
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  return (
    <div
      id="fondo-modal-registro"
      onClick={(e) => e.target.id === "fondo-modal-registro" && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-6 transition-all"
    >
      <div
        className={`bg-white flex flex-col relative shadow-2xl overflow-hidden transition-all duration-300 ${
          pantallaCompleta ? "w-full h-full rounded-none" : "w-[95vw] max-w-7xl h-[92vh] rounded-lg"
        }`}
      >
        <div className="bg-navy px-4 sm:px-6 py-3 text-white flex justify-between items-start sm:items-center gap-3 shrink-0">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-2">
            <h3 className="text-lg sm:text-xl font-bold">{socio.razonSocial}</h3>
            <span className={chip}>CUIT: {socio.cuit}</span>
            <span className={`${chip} capitalize`}>{socio.categoria}</span>
            <span className={chip}>{socio.email}</span>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-4">
            <button
              onClick={() => setPantallaCompleta((v) => !v)}
              className="text-gray-300 hover:text-white transition-colors p-2"
              title={pantallaCompleta ? "Restaurar tamaño" : "Pantalla completa"}
            >
              {pantallaCompleta ? <FaCompress size={18} /> : <FaExpand size={18} />}
            </button>
            <button onClick={onClose} aria-label="Cerrar" className="text-gray-300 hover:text-white p-2">
              <FaTimes size={22} />
            </button>
          </div>
        </div>

        <div className="flex-grow bg-gray-100 flex items-center justify-center overflow-hidden">
          <VisorConstancia url={socio.constanciaUrl} razonSocial={socio.razonSocial} />
        </div>

        <div className="px-4 sm:px-6 py-4 bg-white border-t border-gray-200 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end shrink-0">
          <button
            disabled={procesando}
            onClick={() => onDecision(socio.id, "rechazado")}
            className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-bold rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <FaBan /> Rechazar Solicitud
          </button>
          <button
            disabled={procesando}
            onClick={() => onDecision(socio.id, "aprobado")}
            className="px-6 py-2.5 bg-[#00B859] hover:bg-[#009649] text-white font-bold rounded shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <FaCheck /> Aprobar Socio
          </button>
        </div>
      </div>
    </div>
  );
}
