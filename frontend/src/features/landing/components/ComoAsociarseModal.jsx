import { createPortal } from "react-dom";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import { contacto } from "../data/contacto";

/** Renderizar solo cuando está abierto: {abierto && <ComoAsociarseModal onClose={…} />} */
export default function ComoAsociarseModal({ onClose }) {
  useBloquearScroll();

  return createPortal(
    <div
      onClick={onClose}
      className="rounded-sm fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-gray-300 rounded-sm shadow-2xl p-4 sm:p-8 md:p-12 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative mx-2 sm:mx-4 animacion-modal"
      >
        <h3 className="text-xl sm:text-2xl md:text-[26px] font-normal text-center text-primary mb-5 sm:mb-8 font-sans tracking-wide">
          COMO SUMARSE A CAPYMEF
        </h3>

        <div className="font-sans text-gray-900 text-sm sm:text-lg leading-relaxed space-y-2">
          <p>Para garantizar una atención personalizada y asignarte la categoría ideal para tu pyme, el proceso de alta inicial lo realizamos de forma directa.</p>
          <p>¿Cómo ser socio?</p>
          <p>Contactanos: Escribinos o acercate a nuestras oficinas para conocer los requisitos formales y completar tu solicitud de ingreso oficial.</p>
          <p>Tu Alta: Tu solicitud será evaluada y aprobada por la Comisión Directiva para darte la bienvenida a la Cámara.</p>
          <p>Registro Digital: Una vez que tu alta sea aprobada, podrás volver a esta página web, crear tu cuenta y subir tu documentación para acceder a tu panel de autogestión, beneficios y pago de cuotas.</p>

          <p className="pt-2">Nuestras vías de contacto:</p>
          <div className="flex flex-col lg:flex-row gap-5">
            <ul className="space-y-3 flex-1">
              <li>📍 Dirección: {contacto.direccion}</li>
              <li>📱 Tel: {contacto.telefono}</li>
              <li>✉️ Correo: {contacto.correo}</li>
            </ul>
            <iframe
              title="Ubicación de CAPYMEF"
              className="w-full lg:w-142.5 max-w-full h-44 sm:h-48 rounded shadow"
              src={contacto.mapaEmbed}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div className="flex justify-end mt-10 font-sans">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-full transition-colors text-sm tracking-wide shadow-md"
          >
            ENTENDIDO
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
