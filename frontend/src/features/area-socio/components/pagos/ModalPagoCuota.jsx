import { useEffect, useState } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import {
  FaArrowUpRightFromSquare,
  FaCreditCard,
  FaLock,
  FaXmark,
} from "react-icons/fa6";
import { crearOrdenPagoCuota, irAlCheckout } from "@/services/socioServices";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import { formatearFechaCuota, formatearMonto, formatearPeriodo } from "../../utils/cuotas";

const PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY;
if (PUBLIC_KEY) initMercadoPago(PUBLIC_KEY, { locale: "es-AR" });

/** Renderizar solo con cuota: {cuotaAPagar && <ModalPagoCuotaLazy cuota={cuotaAPagar} onClose={…} />} */
export default function ModalPagoCuota({ cuota, onClose }) {
  const [orden, setOrden] = useState(null);
  const [error, setError] = useState("");
  const [brickListo, setBrickListo] = useState(false);
  const [brickFallo, setBrickFallo] = useState(false);

  useBloquearScroll();

  useEffect(() => {
    let activo = true;
    crearOrdenPagoCuota(cuota.id).then((resultado) => {
      if (!activo) return;
      if (resultado.exito) setOrden(resultado.data);
      else setError(resultado.mensaje);
    });
    return () => {
      activo = false;
    };
  }, [cuota.id]);

  useEffect(() => {
    const cerrarConEscape = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [onClose]);

  const usarBrick = Boolean(PUBLIC_KEY && orden?.preferenceId && !brickFallo);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animacion-modal max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-pago"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-blue text-primary">
              <FaCreditCard />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Pago online
              </p>
              <h2
                id="titulo-pago"
                className="mt-0.5 text-xl font-semibold text-navy first-letter:uppercase"
              >
                Cuota de {formatearPeriodo(cuota.mes_anio)}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors hover:bg-surface hover:text-navy"
            aria-label="Cerrar"
          >
            <FaXmark className="text-xl" />
          </button>
        </div>

        <div className="mt-5 flex items-end justify-between rounded-xl border border-primary/15 bg-surface-blue/50 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total a abonar
            </p>
            <p className="mt-0.5 text-3xl font-semibold text-navy tabular-nums">
              {formatearMonto(cuota.monto)}
            </p>
          </div>
          <p className="text-xs font-medium text-slate-600 sm:text-sm">
            Vence el {formatearFechaCuota(cuota.fecha_vencimiento)}
          </p>
        </div>

        <div className="mt-5 min-h-[60px]">
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              {error}
            </p>
          ) : !orden ? (
            <p className="rounded-xl bg-surface py-5 text-center text-sm text-slate-500">
              Preparando el pago...
            </p>
          ) : usarBrick ? (
            <>
              {!brickListo && (
                <p className="py-4 text-center text-sm text-slate-500">
                  Cargando Mercado Pago...
                </p>
              )}
              <Wallet
                initialization={{ preferenceId: orden.preferenceId, redirectMode: "self" }}
                onReady={() => setBrickListo(true)}
                onError={(e) => {
                  console.error("Error en el botón de Mercado Pago:", e);
                  setBrickFallo(true);
                }}
              />
            </>
          ) : (
            <button
              type="button"
              onClick={() => irAlCheckout(orden.linkPago)}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-dark"
            >
              Pagar con Mercado Pago <FaArrowUpRightFromSquare className="text-xs" />
            </button>
          )}
        </div>

        <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-surface p-3.5 text-xs leading-relaxed text-slate-600">
          <FaLock className="mt-0.5 shrink-0 text-primary" />
          El pago se realiza en el sitio seguro de Mercado Pago. CAPYMEF no recibe ni guarda los datos de tu tarjeta. Al finalizar vas a volver al panel.
        </p>

        <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-surface hover:text-navy"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
