import { useState } from "react";
import ModalShell from "@/shared/ui/ModalShell";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import { btnCancelarClase, btnGuardarClase } from "@/shared/ui/estilos";
import { EMAIL_CAPYMEF, LARGO_MAXIMO_SOLICITUD } from "../../utils/contacto";

/**
 * Los datos institucionales solo los cambia la administración. No hay endpoint de
 * solicitudes: se arma un mail a CAPYMEF con el pedido.
 * Renderizar solo cuando está abierto: {abierto && <SolicitudModificacionModal … />}
 */
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
    <ModalShell titulo="Modificar datos institucionales" onClose={onClose} ancho="max-w-lg">
      {enviada ? (
        <div className="p-6 text-center">
          <h4 className="text-xl font-bold text-navy">Solicitud preparada</h4>
          <p className="mt-3 text-sm text-gray-600">Se abrió tu correo con el pedido dirigido a {EMAIL_CAPYMEF}. Enviá el mail para que la administración lo revise.</p>
          <button type="button" onClick={onClose} className={`${btnGuardarClase} mx-auto mt-6`}>Cerrar</button>
        </div>
      ) : (
        <form onSubmit={enviar} className="p-6">
          <p className="text-sm text-gray-600">Contanos qué dato necesitás corregir y cuál debería ser el valor correcto. La administración de CAPYMEF revisará el pedido.</p>
          <textarea
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            required
            maxLength={LARGO_MAXIMO_SOLICITUD}
            rows="5"
            placeholder="Ej.: Solicito actualizar el rubro a..."
            className="mt-4 w-full resize-none border border-[#cfdbe3] p-3 text-sm text-navy outline-none focus:border-primary"
          />
          <p className="text-right text-xs text-gray-500">{detalle.length}/{LARGO_MAXIMO_SOLICITUD}</p>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={onClose} className={btnCancelarClase}>Cancelar</button>
            <button type="submit" className={btnGuardarClase}>Enviar solicitud</button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}
