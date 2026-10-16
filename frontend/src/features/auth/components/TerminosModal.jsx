import { useEffect } from "react";
import ModalShell from "@/shared/ui/ModalShell.jsx";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll.js";
import { terminos } from "../data/terminos.js";

export default function TerminosModal({ onClose, onAceptar }) {
  useBloquearScroll(true);

  useEffect(() => {
    const alTeclear = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onClose]);

  return (
    <ModalShell titulo="Términos y Condiciones" onClose={onClose} ancho="max-w-2xl">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 text-[14px] leading-relaxed text-[#3c4a57] sm:px-7">
        {terminos.map((seccion) => (
          <section key={seccion.titulo}>
            <h4 className="mb-1.5 font-bold text-[#162b3d]">{seccion.titulo}</h4>
            {seccion.parrafos.map((texto) => (
              <p key={texto} className="mb-2 last:mb-0">
                {texto}
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#dfe6ee] bg-[#f5f7f9] px-5 py-3 sm:flex-row sm:justify-end sm:px-7">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-[9px] border border-[#c5d2de] px-5 text-[14px] font-bold text-[#4a5966] transition-colors hover:bg-[#e4edf9]"
        >
          Cerrar
        </button>
        <button
          type="button"
          onClick={onAceptar}
          className="h-10 rounded-[9px] bg-[#0877a8] px-5 text-[14px] font-bold text-white shadow-[0_3px_5px_rgba(2,74,106,0.25)] transition-colors hover:bg-[#05648f]"
        >
          Aceptar términos
        </button>
      </div>
    </ModalShell>
  );
}