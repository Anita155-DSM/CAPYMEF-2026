import { useState } from "react";
import { FaBuilding, FaCircleCheck, FaXmark } from "react-icons/fa6";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import { EMAIL_CAPYMEF, LARGO_MAXIMO_SOLICITUD } from "../../utils/contacto";

export default function SolicitudModificacionModal({ usuario, onClose }) {
  const [detalle, setDetalle] = useState("");
  const [enviada, setEnviada] = useState(false);
  useBloquearScroll();

  const nombreEmpresa = usuario.razonSocial || "Tu empresa";

  const enviar = (e) => {
    e.preventDefault();
    const texto = detalle.trim();
    if (!texto) return;
    const asunto = `Solicitud de modificación de datos - ${nombreEmpresa}`;
    const cuerpo = `Empresa: ${nombreEmpresa}\nCUIT: ${usuario.cuit || "-"}\nSocio N°: ${usuario.id || "-"}\n\nDetalle del pedido:\n${texto}`;
    window.location.href = `mailto:${EMAIL_CAPYMEF}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    setEnviada(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animacion-modal w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Modificar datos institucionales"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-blue text-primary">
              <FaBuilding />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Ficha institucional
              </p>
              <h3 className="text-lg font-semibold text-navy">
                Solicitar modificación de datos
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg text-slate-400 transition-colors hover:bg-surface hover:text-navy"
          >
            <FaXmark className="text-xl" />
          </button>
        </div>

        {enviada ? (
          <div className="py-6 text-center">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600">
              <FaCircleCheck />
            </span>
            <h4 className="text-lg font-semibold text-navy">Solicitud preparada</h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Se abrió tu cliente de correo con el pedido dirigido a{" "}
              <strong className="font-semibold text-navy">{EMAIL_CAPYMEF}</strong>. Enviá el mensaje para que la administración lo revise.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 cursor-pointer rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-dark"
            >
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-5">
            <p className="text-sm leading-relaxed text-slate-600">
              Contanos qué dato institucional necesitás actualizar y cuál debería ser el valor correcto. La administración de CAPYMEF revisará el pedido.
            </p>
            <textarea
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              required
              maxLength={LARGO_MAXIMO_SOLICITUD}
              rows="5"
              placeholder="Ej.: Solicito actualizar el rubro o actividad principal a..."
              className="mt-4 w-full resize-none rounded-xl border border-slate-200 bg-surface/60 p-3.5 text-sm text-navy outline-none transition-colors focus:border-primary focus:bg-white"
            />
            <p className="mt-1 text-right text-xs text-slate-400 tabular-nums">
              {detalle.length}/{LARGO_MAXIMO_SOLICITUD}
            </p>
            <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-surface hover:text-navy"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="cursor-pointer rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-dark"
              >
                Enviar solicitud
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
