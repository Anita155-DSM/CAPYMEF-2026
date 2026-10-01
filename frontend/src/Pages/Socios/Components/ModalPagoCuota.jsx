import { useEffect, useState } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { FaArrowUpRightFromSquare, FaLock } from "react-icons/fa6";
import {
  crearOrdenPagoCuota,
  formatearFecha,
  formatearMonto,
  formatearPeriodo,
  irAlCheckout,
} from "../../../services/socioServices";

// La public key es pública por diseño (identifica la cuenta en el navegador).
// El access token secreto vive solo en el backend.
const PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY;
if (PUBLIC_KEY) initMercadoPago(PUBLIC_KEY, { locale: "es-AR" });

export default function ModalPagoCuota({ cuota, onClose }) {
  const [orden, setOrden] = useState(null); // { linkPago, preferenceId }
  const [error, setError] = useState("");
  const [brickListo, setBrickListo] = useState(false);
  const [brickFallo, setBrickFallo] = useState(false);

  // Cada apertura del modal crea la preferencia en el backend (que valida que la cuota sea del socio).
  useEffect(() => {
    let activo = true;
    crearOrdenPagoCuota(cuota.id)
      .then((datos) => activo && setOrden(datos))
      .catch((err) => activo && setError(err.message));
    return () => {
      activo = false;
    };
  }, [cuota.id]);

  useEffect(() => {
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const cerrarConEscape = (evento) => evento.key === "Escape" && onClose();
    window.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.body.style.overflow = overflowOriginal;
      window.removeEventListener("keydown", cerrarConEscape);
    };
  }, [onClose]);

  const usarBrick = Boolean(PUBLIC_KEY && orden?.preferenceId && !brickFallo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A46]/50 px-4" onMouseDown={(evento) => evento.target === evento.currentTarget && onClose()}>
      <div className="w-full max-w-lg border border-[#d7e0e5] bg-white p-6 shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="titulo-pago">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-[#1D7BB6]">Pago online</p>
            <h2 id="titulo-pago" className="mt-1 text-xl font-bold text-[#132A46] first-letter:uppercase">Cuota de {formatearPeriodo(cuota.mes_anio)}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-gray-500 hover:text-[#132A46]" aria-label="Cerrar">&times;</button>
        </div>

        <div className="mt-5 flex items-end justify-between border-y border-gray-200 py-4">
          <div>
            <p className="text-sm uppercase text-gray-600">Total a pagar</p>
            <p className="text-3xl font-bold text-[#151515]">{formatearMonto(cuota.monto)}</p>
          </div>
          <p className="text-sm text-gray-600">Vence el {formatearFecha(cuota.fecha_vencimiento)}</p>
        </div>

        <div className="mt-5 min-h-[60px]">
          {error ? (
            <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
          ) : !orden ? (
            <p className="py-4 text-center text-sm text-gray-600">Preparando el pago...</p>
          ) : (
            <>
              {usarBrick && (
                <>
                  {!brickListo && <p className="py-4 text-center text-sm text-gray-600">Cargando Mercado Pago...</p>}
                  <Wallet
                    initialization={{ preferenceId: orden.preferenceId, redirectMode: "self" }}
                    onReady={() => setBrickListo(true)}
                    onError={(errorBrick) => {
                      console.error("Error en el botón de Mercado Pago:", errorBrick);
                      setBrickFallo(true);
                    }}
                  />
                </>
              )}
              {!usarBrick && (
                <button
                  type="button"
                  onClick={() => irAlCheckout(orden.linkPago)}
                  className="inline-flex w-full items-center justify-center gap-2 bg-[#2693bf] px-4 py-3 text-sm font-bold text-white hover:bg-[#1b789f]"
                >
                  Pagar con Mercado Pago <FaArrowUpRightFromSquare />
                </button>
              )}
            </>
          )}
        </div>

        <p className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <FaLock className="mt-0.5 shrink-0" />
          El pago se realiza en el sitio seguro de Mercado Pago. CAPYMEF no recibe ni guarda los datos de tu tarjeta. Al finalizar vas a volver al panel.
        </p>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className="border border-[#d7e0e5] px-4 py-2 text-sm text-[#17384f] hover:bg-[#f4f9fc]">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
